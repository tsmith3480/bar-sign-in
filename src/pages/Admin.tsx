import { useState, useEffect } from "react";
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
import { useWeekStats, useDrawings, usePatrons, useSignIns } from "../hooks";
import type { WeekStats } from "../types/database";

export default function Admin() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<WeekStats | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Initialize hooks
  const { fetchWeekStats } = useWeekStats();
  const { performDrawing: performDrawingDB, deleteDrawing } = useDrawings();
  const { getAllPatrons } = usePatrons();
  const { getWeekSignInIds } = useSignIns();

  // Perform the weekly drawing
  const performDrawing = async () => {
    if (!currentWeek) return;
    setIsDrawing(true);

    try {
      // Get this week's sign-in patron IDs
      const thisWeekSignInIds = await getWeekSignInIds(currentWeek.weekNumber);
      const thisWeekSignedInPatrons = new Set(thisWeekSignInIds);

      // Get all registered patrons
      const allPatrons = await getAllPatrons();

      if (!allPatrons?.length) {
        throw new Error("No patrons found in database");
      }

      // Perform the drawing
      const result = await performDrawingDB(
        currentWeek.weekNumber,
        currentWeek.prizeAmount,
        allPatrons,
        thisWeekSignedInPatrons
      );

      // Show the drawing result
      const title = result.isWinner
        ? "Winner Found!"
        : result.noSignIns
        ? "No Sign-Ins This Week"
        : "No Winner This Week";

      const description = result.isWinner
        ? `Winner: ${result.selectedPatron.name} (Number: ${result.selectedPatron.assigned_number})`
        : result.noSignIns
        ? `Drawn patron #${result.selectedPatron.assigned_number} (${result.selectedPatron.name}) would have won if they had signed in. The prize will roll over.`
        : `Drawn patron #${result.selectedPatron.assigned_number} (${result.selectedPatron.name}) did not sign in this week. The prize will roll over.`;

      toast({
        title,
        description,
        status: result.isWinner ? "success" : "info",
        duration: null,
        isClosable: true,
      });

      // Refresh stats
      await loadWeekStats();
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

  // Load week stats with error handling
  const loadWeekStats = async () => {
    try {
      const stats = await fetchWeekStats();
      setCurrentWeek(stats);
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
  };

  // Reset drawing function
  const resetDrawing = async () => {
    if (!currentWeek) return;

    try {
      await deleteDrawing(currentWeek.weekNumber);

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
        description: "The current week's drawing has been deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh all stats to ensure everything is in sync
      await loadWeekStats();
    } catch (error) {
      toast({
        title: "Reset Failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Load initial stats
  useEffect(() => {
    loadWeekStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
                      onClick={resetDrawing}
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
