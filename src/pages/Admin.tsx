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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface WeekStats {
  weekNumber: number;
  signInCount: number;
  prizeAmount: number;
  isDrawingDone: boolean;
  effectiveWeek: number;
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
        .select("drawn_at, winner_id")
        .eq("week_number", weekNumber)
        .maybeSingle();

      if (drawingCheckError) throw drawingCheckError;

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
      if (!thisWeekSignIns?.length) {
        throw new Error("No sign-ins for this week");
      }

      // Create a Set of patron_ids who signed in this week for quick lookup
      const thisWeekSignedInPatrons = new Set(
        thisWeekSignIns.map((signIn) => signIn.patron_id)
      );

      // Get a list of all patrons who have ever signed in (for fairness)
      const { data: signInRecords, error: signInError } = await supabase
        .from("sign_ins")
        .select("patron_id");

      if (signInError) throw signInError;

      if (!signInRecords?.length) {
        throw new Error("No patrons have ever signed in");
      }

      // Get unique patron IDs
      const uniquePatronIds = Array.from(
        new Set(signInRecords.map((r) => r.patron_id))
      );

      console.log("Unique patron IDs:", uniquePatronIds);

      // Get the full patron details for all who have ever signed in
      const { data: allPatrons, error: allPatronsError } = await supabase
        .from("patrons")
        .select("id, assigned_number, name")
        .in("id", uniquePatronIds);

      if (allPatronsError) {
        console.error("Error fetching patron details:", allPatronsError);
        throw allPatronsError;
      }

      // No need to remove duplicates since we're querying patrons directly
      if (!allPatrons?.length) {
        throw new Error("No matching patrons found in database");
      }

      console.log("Found patrons:", allPatrons);

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
      toast({
        title: isWinner ? "Winner Found!" : "No Winner This Week",
        description: isWinner
          ? `Winner: ${selectedPatron.name} (Number: ${selectedPatron.assigned_number})`
          : `Drawn patron #${selectedPatron.assigned_number} (${selectedPatron.name}) did not sign in this week. The prize will roll over.`,
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

                <Button
                  colorScheme="purple"
                  size="lg"
                  width="full"
                  onClick={performDrawing}
                  disabled={isDrawing || currentWeek.signInCount === 0}
                >
                  {isDrawing ? "Drawing..." : "Perform Drawing"}
                </Button>
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
