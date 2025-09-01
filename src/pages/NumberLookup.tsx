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
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function NumberLookup() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [patron, setPatron] = useState<{
    name: string;
    assigned_number: number;
  } | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPatron(null);

    try {
      const { data, error } = await supabase
        .from("patrons")
        .select("name, assigned_number")
        .ilike("name", `%${name}%`)
        .order("name")
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Not found",
          description: "No patron found with that name",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setPatron(data[0]);
    } catch (error) {
      toast({
        title: "Lookup failed",
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
        <Stack spacing={6}>
          <Heading size="xl">Look Up Your Number</Heading>

          <Text textAlign="center" color="gray.600">
            Enter your name to find your assigned number
          </Text>

          <form onSubmit={handleSubmit}>
            <Stack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Your Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
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
                {isLoading ? "Looking up..." : "Look Up"}
              </Button>
            </Stack>
          </form>

          {patron && (
            <Card variant="filled" bg="blue.50">
              <CardBody>
                <StatGroup>
                  <Stat>
                    <StatLabel>Your Name</StatLabel>
                    <StatNumber fontSize="xl">{patron.name}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Your Number</StatLabel>
                    <StatNumber fontSize="2xl" color="blue.600">
                      {patron.assigned_number}
                    </StatNumber>
                  </Stat>
                </StatGroup>
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
