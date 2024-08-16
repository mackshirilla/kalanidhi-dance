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

  // Flag to detect interaction with form fields
  let formInteraction = false;

  // Detect interaction with key form fields (like typing or focus)
  const formFields = [
    "First-Name",
    "Last-Name",
    "email",
    "Phone",
    "Subject",
    "Message",
  ];

  formFields.forEach((field) => {
    const fieldElement = document.querySelector(`#${field}`);
    if (fieldElement) {
      // Track focus and input events to detect user interaction
      fieldElement.addEventListener("focus", () => {
        formInteraction = true;
        console.log(`User focused on field: ${field}`);
      });
      fieldElement.addEventListener("input", () => {
        formInteraction = true;
        console.log(`User interacted with field: ${field}`);
      });
    }
  });

  // Intercept Webflow form submission and prevent it
  myForm.onFormSubmit((data, event) => {
    // Prevent the default form submission
    event.preventDefault();
    console.log("Form submission intercepted.");

    // Check the time difference between form load and submission
    const currentTime = Date.now();
    const timeDifference = (currentTime - formLoadTime) / 1000; // Time in seconds
    console.log("Form submitted after:", timeDifference, "seconds");

    // Define a threshold (e.g., 5 seconds) that indicates a too-quick submission
    if (timeDifference < 5) {
      console.log(
        "Form submitted too quickly (under 5 seconds), blocking submission."
      );
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

    // Check for user interaction
    if (!formInteraction) {
      console.log("No form interaction detected, blocking submission.");
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message: "Please interact with the form fields before submitting.",
      });
      return; // Block form submission
    } else {
      console.log("Form interaction detected, continuing...");
    }

    // Check if the honeypot field "Company" is filled out
    if (data.Company) {
      console.log(
        "Honeypot field detected (Company filled), blocking submission."
      );
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message: "Form validation failed. Please try again.",
      });
      return; // Exit the function to stop the form from being submitted
    } else {
      console.log("Honeypot validation passed (Company field is empty).");
    }

    // Block Cyrillic or non-Latin scripts in the "Message" field
    const nonLatinRegex = /[А-Яа-яЁё\u0600-\u06FF\u4E00-\u9FFF\u0590-\u05FF]/g;
    if (nonLatinRegex.test(data.Message)) {
      console.log(
        "Non-Latin characters detected in the message, blocking submission."
      );
      myForm.showErrorState();
      const errorComponent = myForm.getErrorComponent();
      errorComponent.updateTextViaAttrVar({
        message: "Please avoid using unsupported characters in the message.",
      });
      return; // Block form submission
    } else {
      console.log("Character validation passed (no non-Latin characters).");
    }

    // Execute reCAPTCHA v3 and get the token
    console.log("Initiating reCAPTCHA validation...");
    grecaptcha.ready(function () {
      grecaptcha
        .execute("6LdYAScqAAAAADnLVL2ykyZGLwq7YGb-FARHbb85", {
          action: "submit",
        })
        .then(function (token) {
          console.log("reCAPTCHA token received:", token);

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
              console.log("Xano response received:", result);
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
              console.log("Error occurred during Xano API call:", error);
              myForm.showErrorState();
              const errorComponent = myForm.getErrorComponent();
              errorComponent.updateTextViaAttrVar({
                message:
                  "An error occurred while validating reCAPTCHA. Please try again.",
              });
            });
        })
        .catch((error) => {
          console.log("Error with reCAPTCHA execution:", error);
        });
    });
  });
};
