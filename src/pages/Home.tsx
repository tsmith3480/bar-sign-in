import { Box, Button, Heading, Stack, Container } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

export default function Home() {
  return (
    <Box p={8} bg="gray.50" minH="100vh">
      <Container maxW="md">
        <Stack spacing={6}>
          <Heading textAlign="center" size="xl" mb={4}>
            Lucky Draw Sign-In
          </Heading>

          <Button
            as={RouterLink}
            to="/register"
            size="lg"
            colorScheme="blue"
            height="16"
            _hover={{
              color: "white",
              transform: "scale(1.02)",
            }}
          >
            First Time? Register Here
          </Button>

          <Button
            as={RouterLink}
            to="/sign-in"
            size="lg"
            colorScheme="green"
            height="16"
            _hover={{
              color: "white",
              transform: "scale(1.02)",
            }}
          >
            Sign In for Drawing
          </Button>

          <Button
            as={RouterLink}
            to="/lookup"
            size="lg"
            colorScheme="purple"
            height="16"
            _hover={{
              color: "white",
              transform: "scale(1.02)",
            }}
          >
            Look Up Your Number
          </Button>

          <Button
            as={RouterLink}
            to="/admin"
            size="lg"
            colorScheme="red"
            height="16"
            _hover={{
              color: "white",
              transform: "scale(1.02)",
            }}
          >
            Admin Panel
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
