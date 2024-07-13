import React, { useEffect } from "react";

const JoinUsPage = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div id="join" style={{ padding: "50px 0", backgroundColor: "#f9f9f9", textAlign: "center" }}>
      <div className="container">
        <div className="col-md-8 col-md-offset-2 section-title">
          <h2 style={{ marginBottom: "20px", color: "#333" }}>Join Us Today!</h2>
          <p style={{ marginBottom: "30px", color: "#666" }}>
            Become a part of our community by filling out the form below.
          </p>
          <div data-tf-live="01J2PDHVR85DMS1HWTWJB2DD22" style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}></div>
        </div>
      </div>
    </div>
  );
};

export default JoinUsPage;
