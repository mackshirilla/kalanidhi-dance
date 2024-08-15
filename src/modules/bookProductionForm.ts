import { WFFormComponent } from "@xatom/core";
declare var grecaptcha: any;

// Define the form submission logic as a function
export const bookProductionFormSubmissionFn = () => {
  // Initialize a new instance of WFFormComponent for the form
  const myForm = new WFFormComponent<{
    "First-Name": string;
    "Last-Name": string;
    "Phone-Number": string;
    Email: string;
    Production: string;
    Message: string;
    "First-Name-2"?: string; // These fields are optional but will be validated
    "Last-Name-2"?: string;
    Company?: string;
    Field?: string;
  }>("#bookProductionForm");

  // Intercept Webflow form submission and prevent it
  myForm.onFormSubmit((data, event) => {
    // Prevent the default form submission
    event.preventDefault();

    // Check if any of the hidden fields have values (honeypot fields)
    if (
      data["First-Name-2"] ||
      data["Last-Name-2"] ||
      data.Company ||
      data.Field
    ) {
      // If any honeypot field contains data, show an error and prevent form submission
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message: "Form validation failed. Please try again.",
      });
      return; // Exit the function to stop the form from being submitted
    }

    // Execute reCAPTCHA v3 and get the token
    grecaptcha.ready(function () {
      grecaptcha
        .execute("6LdYAScqAAAAADnLVL2ykyZGLwq7YGb-FARHbb85", {
          action: "submit",
        })
        .then(function (token) {
          // Send the token to the validation endpoint
          fetch(
            "https://x8ki-letl-twmt.n7.xano.io/api:eGiMZUV4/recaptcha/validate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ "g-recaptcha-response": token }),
            }
          )
            .then((response) => response.json())
            .then((result) => {
              if (result.status === "success") {
                // Append the token to the form data
                data["g-recaptcha-response"] = token;

                // Submit the Webflow form programmatically
                myForm.submitWebflowForm();

                // Show the success state
                myForm.showSuccessState();
              } else {
                // Show error message using xAtom
                myForm.showErrorState();
                const errorComponent = myForm.getErrorComponent();
                errorComponent.updateTextViaAttrVar({
                  message: "reCAPTCHA validation failed. Please try again.",
                });
              }
            })
            .catch((error) => {
              // Handle network errors and show error message
              myForm.showErrorState();
              const errorComponent = myForm.getErrorComponent();
              errorComponent.updateTextViaAttrVar({
                message:
                  "An error occurred while validating reCAPTCHA. Please try again.",
              });
            });
        });
    });
  });
};
