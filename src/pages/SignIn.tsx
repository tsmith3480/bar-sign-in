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
import { supabase } from "../lib/supabase";

interface Patron {
  id: string;
  name: string;
  assigned_number: number;
  contact?: string;
  isAlreadySignedIn?: boolean;
}

export default function SignIn() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingPatrons, setMatchingPatrons] = useState<Patron[]>([]);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Search for patrons based on input
  const searchPatrons = async (query: string) => {
    setIsSearching(true);
    setMatchingPatrons([]); // Clear matching patrons when search starts
    setSelectedPatron(null);

    try {
      if (!query.trim()) return;

      // Get current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7
      );

      // Check if query is a number
      const isNumber = !isNaN(Number(query));

      const { data: patrons, error } = await supabase
        .from("patrons")
        .select("*")
        .or(isNumber ? `assigned_number.eq.${query}` : `name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Check which patrons have already signed in this week
      if (patrons && patrons.length > 0) {
        const patronIds = patrons.map((p) => p.id);
        const { data: signIns, error: signInError } = await supabase
          .from("sign_ins")
          .select("patron_id")
          .in("patron_id", patronIds)
          .eq("week_number", weekNumber);

        if (signInError) throw signInError;

        const signedInPatronIds = new Set(
          signIns?.map((s) => s.patron_id) || []
        );

        // Add sign-in status to patrons
        const patronsWithStatus = patrons.map((patron) => ({
          ...patron,
          isAlreadySignedIn: signedInPatronIds.has(patron.id),
        }));

        setMatchingPatrons(patronsWithStatus);

        // If exactly one match is found and they haven't signed in, auto-select them
        if (
          patronsWithStatus.length === 1 &&
          !patronsWithStatus[0].isAlreadySignedIn
        ) {
          setSelectedPatron(patronsWithStatus[0]);
        }
      } else {
        setMatchingPatrons([]);
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
      // Get the current week number (based on ISO week)
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7
      );

      // Create sign-in record
      const { error: signInError } = await supabase.from("sign_ins").insert({
        patron_id: selectedPatron.id,
        week_number: weekNumber,
      });

      if (signInError) throw signInError;

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
