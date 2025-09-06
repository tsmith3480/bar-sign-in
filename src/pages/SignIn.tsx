import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  useToast,
  Container,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { usePatrons, useSignIns, useWeekUtils } from "../hooks";
import type { Patron } from "../types/database";

export default function SignIn() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingPatrons, setMatchingPatrons] = useState<Patron[]>([]);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Initialize hooks
  const { searchPatrons: searchPatronsDB } = usePatrons();
  const { enrichPatronsWithSignInStatus, createSignIn } = useSignIns();
  const { getCurrentWeek } = useWeekUtils();

  // Search for patrons based on input
  const searchPatrons = async (query: string) => {
    setIsSearching(true);
    setMatchingPatrons([]); // Clear matching patrons when search starts
    setSelectedPatron(null);

    try {
      if (!query.trim()) return;

      // Get current week number
      const weekNumber = getCurrentWeek();

      // Search for patrons
      const patrons = await searchPatronsDB(query);

      // Enrich patrons with sign-in status
      const patronsWithStatus = await enrichPatronsWithSignInStatus(
        patrons,
        weekNumber
      );

      setMatchingPatrons(patronsWithStatus);

      // If exactly one match is found and they haven't signed in, auto-select them
      if (
        patronsWithStatus.length === 1 &&
        !patronsWithStatus[0].isAlreadySignedIn
      ) {
        setSelectedPatron(patronsWithStatus[0]);
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle patron selection
  const handlePatronSelect = (patron: Patron) => {
    if (patron.isAlreadySignedIn) {
      return; // Don't allow selection of already signed-in patrons
    }
    setSelectedPatron(patron);
    setSearchQuery(`${patron.name} (#${patron.assigned_number})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatron || selectedPatron.isAlreadySignedIn) return;

    setIsLoading(true);

    try {
      // Get the current week number
      const weekNumber = getCurrentWeek();

      // Create sign-in record
      await createSignIn(selectedPatron.id, weekNumber);

      toast({
        title: "Sign-in successful!",
        description: `Welcome back, ${selectedPatron.name}! Your entry has been recorded for this week's drawing.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      <Container maxW="md">
        <form onSubmit={handleSubmit}>
          <Stack spacing={6}>
            <Heading size="xl">Weekly Sign-In</Heading>

            <Text textAlign="center" color="gray.600">
              Sign in with your assigned number to be eligible for this week's
              drawing.
            </Text>

            <FormControl isRequired>
              <FormLabel>Search by Number or Name</FormLabel>
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPatrons(e.target.value);
                }}
                placeholder="Enter number or name"
                size="lg"
                bg="white"
              />
            </FormControl>

            {isSearching && (
              <Text color="gray.500" textAlign="center">
                Searching...
              </Text>
            )}

            {!isSearching && matchingPatrons.length > 0 && (
              <Stack spacing={2}>
                <Text fontWeight="medium" color="gray.600">
                  {selectedPatron ? "Selected patron:" : "Select your name:"}
                </Text>
                {(selectedPatron ? [selectedPatron] : matchingPatrons).map(
                  (patron) => (
                    <Stack key={patron.id} spacing={1}>
                      <Button
                        onClick={() => handlePatronSelect(patron)}
                        variant={
                          selectedPatron?.id === patron.id ? "solid" : "outline"
                        }
                        colorScheme={
                          patron.isAlreadySignedIn
                            ? "gray"
                            : selectedPatron?.id === patron.id
                            ? "green"
                            : "gray"
                        }
                        size="lg"
                        justifyContent="flex-start"
                        isDisabled={patron.isAlreadySignedIn}
                        opacity={patron.isAlreadySignedIn ? 0.5 : 1}
                        cursor={
                          patron.isAlreadySignedIn ? "not-allowed" : "pointer"
                        }
                      >
                        {patron.name} (#{patron.assigned_number})
                        {patron.contact && ` - ${patron.contact}`}
                      </Button>
                      {patron.isAlreadySignedIn && (
                        <Text fontSize="sm" color="gray.500" ml={4}>
                          Already signed in for this week
                        </Text>
                      )}
                    </Stack>
                  )
                )}
              </Stack>
            )}

            <Button
              type="submit"
              colorScheme="green"
              size="lg"
              width="full"
              disabled={isLoading || !selectedPatron}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              size="lg"
              width="full"
            >
              Back to Home
            </Button>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}
