import { ChakraProvider, Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { theme } from "./theme";

// Lazy load pages
import Home from "./pages/Home";
import Registration from "./pages/Registration";
const SignIn = lazy(() => import("./pages/SignIn"));
const NumberLookup = lazy(() => import("./pages/NumberLookup"));
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Suspense fallback={<Box p={8}>Loading...</Box>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/lookup" element={<NumberLookup />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Router>
    </ChakraProvider>
  );
}

export default App;
