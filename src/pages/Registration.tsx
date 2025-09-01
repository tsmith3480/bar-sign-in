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

export default function Registration() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Handle backspacing from a delimiter position
    if (value.length < contact.length && value.length > 0) {
      // If we're at a delimiter position, remove the last digit too
      if (value[value.length - 1].match(/[()-\s]/)) {
        setContact(value.slice(0, -1));
        return;
      }
    }

    // Format the number
    if (numbers.length === 0) {
      setContact("");
    } else if (numbers.length <= 3) {
      setContact(`(${numbers}`);
    } else if (numbers.length <= 6) {
      setContact(`(${numbers.slice(0, 3)})${numbers.slice(3)}`);
    } else {
      setContact(
        `(${numbers.slice(0, 3)})${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
      );
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only process if it's a potential phone number (starts with digits or formatting characters)
    if (value === "" || value.match(/^[\d()-\s]*$/)) {
      formatPhoneNumber(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get the highest assigned number
      const { data: existingPatrons, error: fetchError } = await supabase
        .from("patrons")
        .select("assigned_number")
        .order("assigned_number", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      // Calculate new number (start from 1 or increment highest)
      const newNumber =
        existingPatrons && existingPatrons[0]
          ? existingPatrons[0].assigned_number + 1
          : 1;

      // Insert new patron
      const { data: newPatron, error: insertError } = await supabase
        .from("patrons")
        .insert({
          name,
          contact: contact || null,
          assigned_number: newNumber,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get the current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7
      );

      // Create sign-in record for the current week
      const { error: signInError } = await supabase.from("sign_ins").insert({
        patron_id: newPatron.id,
        week_number: weekNumber,
      });

      if (signInError) throw signInError;

      toast({
        title: "Registration successful!",
        description: `Your assigned number is: ${newNumber}. You are automatically signed in for this week's drawing!`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
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
            <Heading size="xl">New Patron Registration</Heading>

            <Text textAlign="center" color="gray.600">
              Register to participate in our weekly lucky draw. You'll be
              assigned a unique number for the drawings.
            </Text>

            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Enter your full name"
                size="lg"
                bg="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Contact (Optional)</FormLabel>
              <Input
                value={contact}
                onChange={handleContactChange}
                placeholder="Phone number: (555)555-5555"
                size="lg"
                bg="white"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
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
