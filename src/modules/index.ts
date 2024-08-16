import { WFFormComponent } from "@xatom/core";
declare var grecaptcha: any;

// Define the form submission logic as a function
export const contactFormSubmissionFn = () => {
  // Store the time when the form is loaded
  const formLoadTime = Date.now();
  console.log("Form loaded at:", formLoadTime); // Log the form load time

  // Initialize a new instance of WFFormComponent for the form
  const myForm = new WFFormComponent<{
    "First-Name": string;
    "Last-Name": string;
    email: string;
    Phone: string;
    Subject: string;
    Message: string;
    Company?: string; // Honeypot field
  }>("#contactForm");

  // Intercept Webflow form submission and prevent it
  myForm.onFormSubmit((data, event) => {
    // Prevent the default form submission
    event.preventDefault();
    console.log("Form submission intercepted.");

    // Check the time difference between form load and submission
    const currentTime = Date.now();
    const timeDifference = (currentTime - formLoadTime) / 1000; // Time in seconds
    console.log("Form submitted after:", timeDifference, "seconds"); // Log the time difference

    // Define a threshold (e.g., 10 seconds) that indicates a too-quick submission
    if (timeDifference < 10) {
      console.log(
        "Form submitted too quickly (under 10 seconds), blocking submission."
      ); // Log for quick submission
      // If the form is submitted too quickly, show an error and prevent submission
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message:
          "Form submission failed. Please do not submit the form so quickly.",
      });
      return; // Exit the function to stop the form from being submitted
    } else {
      console.log("Time validation passed (more than 10 seconds).");
    }

    // Check if the honeypot field "Company" is filled out
    if (data.Company) {
      console.log(
        "Honeypot field detected (Company filled), blocking submission."
      ); // Log if honeypot is filled
      // If the honeypot field contains data, show an error and prevent form submission
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message: "Form validation failed. Please try again.",
      });
      return; // Exit the function to stop the form from being submitted
    } else {
      console.log("Honeypot validation passed (Company field is empty).");
    }

    // Execute reCAPTCHA v3 and get the token
    console.log("Initiating reCAPTCHA validation...");
    grecaptcha.ready(function () {
      grecaptcha
        .execute("6LdYAScqAAAAADnLVL2ykyZGLwq7YGb-FARHbb85", {
          action: "submit",
        })
        .then(function (token) {
          console.log("reCAPTCHA token received:", token); // Log reCAPTCHA token

          // Send the token and form data to the Xano validation endpoint
          console.log("Sending form data and reCAPTCHA token to Xano...");
          fetch(
            "https://x8ki-letl-twmt.n7.xano.io/api:eGiMZUV4/recaptcha/validate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "g-recaptcha-response": token,
                "First-Name": data["First-Name"],
                "Last-Name": data["Last-Name"],
                Email: data.email,
                Phone: data.Phone,
                Subject: data.Subject,
                Message: data.Message,
                Company: data.Company, // Fixed typo here
              }),
            }
          )
            .then((response) => response.json())
            .then((result) => {
              console.log("Xano response received:", result); // Log Xano response
              if (result.status === "success") {
                console.log(
                  "reCAPTCHA validation successful, submitting form."
                );
                // Append the token to the form data
                data["g-recaptcha-response"] = token;

                // Submit the Webflow form programmatically only after all checks
                myForm.submitWebflowForm();

                // Show the success state
                myForm.showSuccessState();
              } else {
                console.log(
                  "reCAPTCHA validation failed, blocking submission."
                );
                // Show error message using xAtom
                myForm.showErrorState();
                const errorComponent = myForm.getErrorComponent();
                errorComponent.updateTextViaAttrVar({
                  message: "reCAPTCHA validation failed. Please try again.",
                });
              }
            })
            .catch((error) => {
              console.log("Error occurred during Xano API call:", error); // Log fetch error
              // Handle network errors and show error message
              myForm.showErrorState();
              const errorComponent = myForm.getErrorComponent();
              errorComponent.updateTextViaAttrVar({
                message:
                  "An error occurred while validating reCAPTCHA. Please try again.",
              });
            });
        })
        .catch((error) => {
          console.log("Error with reCAPTCHA execution:", error); // Log reCAPTCHA error
        });
    });
  });
};
