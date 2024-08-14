import { WFRoute } from "@xatom/core";
import { contactFormSubmissionFn } from "../modules";
import { bookProductionFormSubmissionFn } from "../modules/bookProductionForm";

// Define the route and link it to the contact form submission function
export const formRoutes = () => {
  new WFRoute("/contact").execute(contactFormSubmissionFn);
  console.log("Contact form routes initialized");
};

// Define the route and link it to the book production form submission function
export const bookProductionRoutes = () => {
  // Route for /currently-presenting (Book a Production)
  new WFRoute("/currently-presenting").execute(bookProductionFormSubmissionFn);

  // Dynamic route for any /repertoire/* URL (Book a Production)
  new WFRoute("/repertoire/(.*)").execute(bookProductionFormSubmissionFn);

  console.log(
    "Book production form routes initialized for both /currently-presenting and /repertoire/*"
  );
};
