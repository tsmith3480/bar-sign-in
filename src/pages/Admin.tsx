import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Stack,
  Heading,
  useToast,
  Container,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { FaSmile, FaSadTear } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface WeekStats {
  weekNumber: number;
  signInCount: number;
  prizeAmount: number;
  isDrawingDone: boolean;
  effectiveWeek: number;
  latestDrawing?: {
    drawnNumber: number;
    drawnName: string;
    wasWinner: boolean;
  };
}

export default function Admin() {
  //   const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<WeekStats | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch current week's stats
  const fetchWeekStats = useCallback(async () => {
    // Get current week number
    const getCurrentWeek = () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7
      );
    };

    const weekNumber = getCurrentWeek();

    try {
      // Check if there's already been a drawing this week
      const { data: thisWeekDrawing, error: drawingCheckError } = await supabase
        .from("drawings")
        .select("drawn_at, winner_id, drawn_number")
        .eq("week_number", weekNumber)
        .maybeSingle();

      if (drawingCheckError) throw drawingCheckError;

      // If there's a drawing, get the patron's name
      let drawnPatronName = "Unknown";
      if (thisWeekDrawing) {
        const { data: patronData } = await supabase
          .from("patrons")
          .select("name")
          .eq("assigned_number", thisWeekDrawing.drawn_number)
          .single();

        if (patronData) {
          drawnPatronName = patronData.name;
        }
      }

      // If there's been a drawing this week, use next week's number
      const effectiveWeek = thisWeekDrawing ? weekNumber + 1 : weekNumber;

      // Get sign-in count for the effective week
      const { data: signIns, error: signInError } = await supabase
        .from("sign_ins")
        .select("id")
        .eq("week_number", effectiveWeek);

      if (signInError) throw signInError;

      // Get current prize amount
      const { data: lastDrawing, error: drawingError } = await supabase
        .from("drawings")
        .select("prize_amount, winner_id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (drawingError) throw drawingError;

      // Each sign-in contributes $1 to the pot
      const currentWeekAmount = signIns?.length || 0;

      // If last drawing had a winner, don't add previous amount
      const previousUnclaimed =
        lastDrawing?.[0] && !lastDrawing[0].winner_id
          ? lastDrawing[0].prize_amount
          : 0;

      setCurrentWeek({
        weekNumber,
        effectiveWeek,
        signInCount: signIns?.length || 0,
        prizeAmount: currentWeekAmount + previousUnclaimed,
        isDrawingDone: !!thisWeekDrawing,
        ...(thisWeekDrawing && {
          latestDrawing: {
            drawnNumber: thisWeekDrawing.drawn_number,
            drawnName: drawnPatronName,
            wasWinner: !!thisWeekDrawing.winner_id,
          },
        }),
      });
    } catch (error) {
      toast({
        title: "Error fetching stats",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]); // Only depends on toast since getCurrentWeek is now inside the callback

  // Perform the weekly drawing
  const performDrawing = async () => {
    if (!currentWeek) return;
    setIsDrawing(true);

    try {
      // Get this week's sign-ins for verification
      const { data: thisWeekSignIns, error: thisWeekError } = await supabase
        .from("sign_ins")
        .select("patron_id")
        .eq("week_number", currentWeek.weekNumber);

      if (thisWeekError) throw thisWeekError;

      // Create a Set of patron_ids who signed in this week for quick lookup
      const thisWeekSignedInPatrons = new Set(
        thisWeekSignIns?.map((signIn) => signIn.patron_id) || []
      );

      // Get all registered patrons
      const { data: allPatrons, error: allPatronsError } = await supabase
        .from("patrons")
        .select("id, assigned_number, name");

      if (allPatronsError) {
        console.error("Error fetching patron details:", allPatronsError);
        throw allPatronsError;
      }

      if (!allPatrons?.length) {
        throw new Error("No patrons found in database");
      }

      // Randomly select one patron from all patrons
      const selectedPatron =
        allPatrons[Math.floor(Math.random() * allPatrons.length)];

      // Check if the selected patron signed in this week
      const isWinner = thisWeekSignedInPatrons.has(selectedPatron.id);

      // Record the drawing result
      const { error: drawingError } = await supabase.from("drawings").insert({
        week_number: currentWeek.weekNumber,
        drawn_number: selectedPatron.assigned_number,
        winner_id: isWinner ? selectedPatron.id : null,
        prize_amount: currentWeek.prizeAmount,
      });

      if (drawingError) throw drawingError;

      // Show the drawing result
      // Determine message based on whether there were any sign-ins
      const noSignIns = thisWeekSignedInPatrons.size === 0;
      const title = isWinner
        ? "Winner Found!"
        : noSignIns
        ? "No Sign-Ins This Week"
        : "No Winner This Week";

      const description = isWinner
        ? `Winner: ${selectedPatron.name} (Number: ${selectedPatron.assigned_number})`
        : noSignIns
        ? `Drawn patron #${selectedPatron.assigned_number} (${selectedPatron.name}) would have won if they had signed in. The prize will roll over.`
        : `Drawn patron #${selectedPatron.assigned_number} (${selectedPatron.name}) did not sign in this week. The prize will roll over.`;

      toast({
        title,
        description,
        status: isWinner ? "success" : "info",
        duration: null,
        isClosable: true,
      });

      // Refresh stats
      await fetchWeekStats();
    } catch (error) {
      console.error("Drawing error:", error);
      toast({
        title: "Drawing failed",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDrawing(false);
    }
  };

  // Load initial stats
  useEffect(() => {
    fetchWeekStats();
  }, [fetchWeekStats]); // fetchWeekStats is stable due to useCallback

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      <Container maxW="xl">
        <Stack spacing={6}>
          <Heading size="xl">Admin Panel</Heading>

          <Text textAlign="center" color="gray.600">
            Manage weekly drawings and view statistics
          </Text>

          {currentWeek && (
            <Card>
              <CardHeader>
                <Heading size="md">Current Week Stats</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Week {currentWeek.weekNumber}</StatLabel>
                    <StatNumber>
                      {currentWeek.isDrawingDone
                        ? "Drawing Complete"
                        : "Drawing Pending"}
                    </StatNumber>
                    <StatHelpText>
                      {currentWeek.isDrawingDone
                        ? `New sign-ins go to Week ${currentWeek.effectiveWeek}`
                        : "Current Week"}
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Sign-ins</StatLabel>
                    <StatNumber>{currentWeek.signInCount}</StatNumber>
                    <StatHelpText>
                      {currentWeek.isDrawingDone
                        ? `Week ${currentWeek.effectiveWeek}`
                        : "This Week"}
                    </StatHelpText>
                  </Stat>
                  <Stat gridColumn="span 2">
                    <StatLabel>Prize Amount</StatLabel>
                    <StatNumber>${currentWeek.prizeAmount}</StatNumber>
                    <StatHelpText>Current Prize Pool</StatHelpText>
                  </Stat>
                </SimpleGrid>

                <Divider my={4} />

                {currentWeek.latestDrawing && (
                  <>
                    <Box
                      mb={4}
                      p={4}
                      bg={
                        currentWeek.latestDrawing.wasWinner
                          ? "green.50"
                          : "gray.50"
                      }
                      borderRadius="md"
                    >
                      <Stack
                        direction="row"
                        align="center"
                        justify="center"
                        spacing={3}
                      >
                        <Icon
                          as={
                            currentWeek.latestDrawing.wasWinner
                              ? FaSmile
                              : FaSadTear
                          }
                          color={
                            currentWeek.latestDrawing.wasWinner
                              ? "green.500"
                              : "gray.500"
                          }
                          boxSize={6}
                        />
                        <Text fontWeight="medium">
                          Drawn: {currentWeek.latestDrawing.drawnName} (#
                          {currentWeek.latestDrawing.drawnNumber})
                        </Text>
                      </Stack>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        textAlign="center"
                        mt={1}
                      >
                        {currentWeek.latestDrawing.wasWinner
                          ? "Winner has signed in!"
                          : "Patron did not sign in this week"}
                      </Text>
                    </Box>
                    <Divider mb={4} />
                  </>
                )}

                <Stack spacing={4}>
                  <Button
                    colorScheme="purple"
                    size="lg"
                    width="full"
                    onClick={performDrawing}
                    isDisabled={isDrawing || currentWeek.isDrawingDone}
                    title={
                      currentWeek.isDrawingDone
                        ? "Drawing for this week has already been completed"
                        : currentWeek.signInCount === 0
                        ? "Drawing will show who would have won if they had signed in"
                        : "Click to perform drawing"
                    }
                  >
                    {isDrawing
                      ? "Drawing..."
                      : currentWeek.isDrawingDone
                      ? "Drawing Complete for Week " + currentWeek.weekNumber
                      : "Perform Drawing"}
                  </Button>

                  {/* Development/testing only - will be removed before production */}
                  {currentWeek.isDrawingDone && (
                    <Button
                      colorScheme="red"
                      variant="outline"
                      size="md"
                      width="full"
                      onClick={async () => {
                        try {
                          // First verify the drawing exists
                          const { data: drawingToDelete, error: findError } =
                            await supabase
                              .from("drawings")
                              .select("*") // Select all fields including id
                              .eq("week_number", currentWeek.weekNumber)
                              .maybeSingle();

                          if (findError) throw findError;

                          if (!drawingToDelete) {
                            throw new Error("No drawing found for this week");
                          }

                          // Delete the drawing for this week
                          const { error: deleteError } = await supabase
                            .from("drawings")
                            .delete()
                            .eq("id", drawingToDelete.id);

                          if (deleteError) throw deleteError;

                          // Set current week stats to reflect no drawing
                          setCurrentWeek({
                            ...currentWeek,
                            isDrawingDone: false,
                            latestDrawing: undefined,
                            // Move sign-ins back to current week
                            effectiveWeek: currentWeek.weekNumber,
                          });

                          toast({
                            title: "Drawing Reset",
                            description:
                              "The current week's drawing has been deleted",
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                          });

                          // Refresh all stats to ensure everything is in sync
                          await fetchWeekStats();
                        } catch (error) {
                          toast({
                            title: "Reset Failed",
                            description:
                              error instanceof Error
                                ? error.message
                                : "An error occurred",
                            status: "error",
                            duration: 5000,
                            isClosable: true,
                          });
                        }
                      }}
                    >
                      Reset Drawing (Dev Only)
                    </Button>
                  )}
                </Stack>
              </CardBody>
            </Card>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            size="lg"
            width="full"
          >
            Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
