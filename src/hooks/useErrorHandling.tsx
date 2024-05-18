import { useEffect } from "react";

const useErrorHandling = (setShowErrorPopup: (show: boolean) => void) => {
  useEffect(() => {
    const handleFetchError = (event: any) => {
      if (event.reason && event.reason.message === "Failed to fetch") {
        setShowErrorPopup(true);
        console.error("Failed to fetch data from the server");
      }
    };

    window.addEventListener("unhandledrejection", handleFetchError);

    return () => {
      window.removeEventListener("unhandledrejection", handleFetchError);
    };
  }, [setShowErrorPopup]);
};

export default useErrorHandling;
