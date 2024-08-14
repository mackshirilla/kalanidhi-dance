import { WFFormComponent } from "@xatom/core";
declare var grecaptcha: any;

// Define the form submission logic as a function
export const rasaBookingFormSubmissionFn = () => {
  // Initialize a new instance of WFFormComponent for the form
  const myForm = new WFFormComponent<{
    "First-Name": string;
    "Last-Name": string;
    "Phone-Number": string;
    Email: string;
    Message: string;
    Production: string;
  }>("#email-form");

  // Intercept Webflow form submission and prevent it
  myForm.onFormSubmit((data, event) => {
    // Prevent the default form submission
    event.preventDefault();

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
