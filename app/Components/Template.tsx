/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import styles from "../styles/WordEditor.module.css";

interface FormData {
  applicant: string;
  doctor: string;
  qmeDate: string;
  qmeTime: string;
  qmeLocation: string;
  altLocation: string;
}

export default function Word() {
  const [activeTab, setActiveTab] = useState("scheduling");
  const [formData, setFormData] = useState<FormData>({
    applicant: "",
    doctor: "",
    qmeDate: "",
    qmeTime: "",
    qmeLocation: "",
    altLocation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>, text: string) => {
    navigator.clipboard.writeText(text);
    e.currentTarget.classList.add(styles.copied);
    setTimeout(() => e.currentTarget.classList.remove(styles.copied), 1500);
  };

  // ---------- EMAIL TEMPLATES ----------
  const templates = {
    scheduling: [
      {
        title: "QME Appointment Confirmation",
        subject: `QME Appointment Confirmation – ${
          formData.applicant || "{Applicant}"
        } / Dr. ${formData.doctor || "{Doctor}"}`,
        body: `Hello,

This is to confirm that the **QME evaluation** for **${
          formData.applicant || "{Applicant}"
        }** with **Dr. ${
          formData.doctor || "{Doctor}"
        }** has been scheduled as follows:

**Date:** ${formData.qmeDate || "{QME Date}"}  
**Time:** ${formData.qmeTime || "{QME Time}"}  
**Location:** ${formData.qmeLocation || "{QME Location}"}  

We have already requested for a **Spanish Interpreter** for this evaluation. Kindly let us know once the **interpreter order is confirmed** and please share the **interpreter details** for our record.

`,
      },
    ],
    reimbursement: [
      {
        title: "Request for Travel Reimbursement (Alternate Location)",
        subject: `Travel Reimbursement Request – ${
          formData.applicant || "{Applicant}"
        } / Dr. ${formData.doctor || "{Doctor}"}`,
        body: `Hello,

As per **Dr. ${
          formData.doctor || "{Doctor}"
        }'s recommendation**, the **nearest and most suitable QME evaluation location** for **${
          formData.applicant || "{Applicant}"
        }** is **${formData.qmeLocation || "{Alternate Location}"}**.  

Considering the applicant’s convenience and medical circumstances, we kindly request the **Defendant’s approval for travel reimbursement** for attending the evaluation at this location.  
Please review and confirm the same at your earliest convenience.


Thanks,  
Aditya`,
      },
    ],
    strike: [
      {
        title: "Initial Strike Letter (Applicant Pulled Panel)",
        subject: `Strike Letter – ${formData.applicant || "{Applicant}"}`,
        body: `Hello,

Please find attached the **Strike Letter** for QME Panel in the matter of **${
          formData.applicant || "{Applicant}"
        }**.  
We have exercised our strike on Panel.

Kindly review and provide your response at your earliest convenience.

`,
      },

      {
        title: "Panel Pulled by Defense – Our Strike Response",
        subject: `Response to Strike - ${formData.applicant || "{applicant}"}`,
        body: `Hello,

We have received your QME panel request for **${
          formData.applicant || "{applicant}"
        }**. Please find attached our strike on for the same panel,

will proceed with **scheduling** the QME with **Dr. ${
          formData.doctor || "{Doctor}"
        }**

Kindly acknowledge receipt at your earliest convenience.

`,
      },

      {
        title: "Second Strike Letter (AA Strike)",
        subject: `Second Strike – ${formData.applicant || "{Applicant}"}`,
        body: `Hello,

Since we did not receive any response from Defense regarding the initial strike, we have now exercised our **second strike** and will proceed with **scheduling** the QME with **Dr. ${
          formData.doctor || "{Doctor}"
        }**.

Please review and advise if you have any objection.

`,
      },
    ],
    report: [
      {
        title: "Follow-Up for QME Report",
        subject: `Follow-Up for QME Report - ${
          formData.applicant || "{applicant}"
        }`,
        body: `Hello,

Following up regarding the QME report for **${
          formData.applicant || "{applicant}"
        }** evaluated by **Dr. ${formData.doctor || "{doctor}"}** on **${
          formData.qmeDate || "{date}"
        }**.

Kindly provide an update on the status of the report at your earliest convenience.

`,
      },
      {
        title: "QME Report Received",
        subject: `QME Report Received – ${
          formData.applicant || "{Applicant}"
        } / Dr. ${formData.doctor || "{Doctor}"}`,
        body: `Hello,

We have received the **QME Report** for **${
          formData.applicant || "{Applicant}"
        }** from **Dr. ${formData.doctor || "{Doctor}"}**.  
Please find attached a copy along with the **Objection Letter** for your review.

`,
      },
    ],
  };

  // ---------- TASKS ----------
  const tasks = {
    scheduling: [
      {
        title: "Prepare Advocacy Letter",
        description: `Hello,

Please prepare the **Advocacy Letter** for **${
          formData.applicant || "{Applicant}"
        }** including case summary, medical background, and relevant history for Dr. ${
          formData.doctor || "{Doctor}"
        } scheduled on ${formData.qmeDate || "{Date}"} at ${
          formData.qmeTime || "{Time}"
        }.

Thanks,  
Aditya`,
      },
      {
        title: "Prepare Medical Index",
        description: `Hello,

Please prepare the **Medical Index** for **${
          formData.applicant || "{Applicant}"
        }** to include all medical reports and treatment records for submission to Dr. ${
          formData.doctor || "{Doctor}"
        }.

Thanks,  
Aditya`,
      },
      {
        title: "Prepare QME Notice",
        description: `Hello,

Please prepare the **QME Notice** for **${
          formData.applicant || "{Applicant}"
        }** including 
        Dr's Name:- **${formData.doctor || "{Dr's Name}"}**
        QME Date:- **${formData.qmeDate || "{Date}"}**, 
        QME Time:- **${formData.qmeTime || "{Time}"}**,
        QME Location:- **${formData.qmeLocation || "{QME Location}"}**
        these details
        and circulate it to all parties.

Thanks,  
Aditya`,
      },
    ],
    reimbursement: [
      {
        title: "Follow-up Reimbursement Approval",
        description: `Hello,

Please follow up with **Defense Attorney** for **travel reimbursement confirmation** for **${
          formData.applicant || "{Applicant}"
        }** regarding the QME with **Dr. ${
          formData.doctor || "{Doctor}"
        }** at **${formData.qmeLocation || "{Alternate Location}"}**.

Thanks,  
Aditya`,
      },
    ],
    strike: [
      {
        title: "Follow-up After Strike",
        description: `Hello,

Please follow up with **Defense Attorney** for acknowledgment of the **strike letter** for **${
          formData.applicant || "{Applicant}"
        }** and update once confirmation is received.

Thanks,  
Aditya`,
      },

      {
        title: "Scheule PQME APPT",
        description: `Hello,

Schedule the PQME APPT for **${
          formData.applicant || "{Applicant}"
        }** with Dr **${formData.doctor || "{Doctor}"}**.

Thanks,  
Aditya`,
      },
    ],
    report: [
      {
        title: "Attach Objection Letter",
        description: `Hello,

Please attach the **Objection Letter** to the **QME Report** received from **Dr. ${
          formData.doctor || "{Doctor}"
        }** for **${
          formData.applicant || "{Applicant}"
        }** and ensure it is sent to all parties.

Thanks,  
Aditya`,
      },
    ],
  };

  const currentTemplates = templates[activeTab as keyof typeof templates];
  const currentTasks = tasks[activeTab as keyof typeof tasks];

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>QME Email & Task Generator</h1>

      {/* Input Section */}
      <section className={styles.input_section}>
        {Object.keys(formData).map((key) => (
          <div key={key} className={styles.input_group}>
            <label className={styles.label}>{key}</label>
            <input
              type="text"
              name={key}
              value={(formData as any)[key]}
              onChange={handleChange}
              placeholder={`Enter ${key}`}
              className={styles.input}
            />
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div className={styles.tabs}>
        {["strike", "scheduling", "reimbursement", "report"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab_button} ${
              activeTab === tab ? styles.active_tab : ""
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Email Templates */}
      <section className={styles.templates_section}>
        <h2 className={styles.subheading}>Email Templates</h2>

        {currentTemplates.map((template, i) => (
          <div key={i} className={styles.template_box}>
            <h3>{template.title}</h3>

            <div className={styles.copy_buttons}>
              <button
                className={styles.copy_button}
                onClick={(e) => handleCopy(e, template.subject)}
              >
                Copy Subject
              </button>
              <button
                className={styles.copy_button}
                onClick={(e) => handleCopy(e, template.body)}
              >
                Copy Body
              </button>
              <button
                className={styles.copy_button}
                onClick={(e) =>
                  handleCopy(
                    e,
                    `Subject: ${template.subject}\n\n${template.body}`
                  )
                }
              >
                Copy All
              </button>
            </div>

            <p className={styles.template_subject}>
              <strong>Subject:</strong> {template.subject}
            </p>
            <pre className={styles.template_body}>{template.body}</pre>
          </div>
        ))}
      </section>

      {/* Tasks Section */}
      <section className={styles.tasks_section}>
        <h2 className={styles.subheading}>Tasks</h2>

        {currentTasks.map((task, i) => (
          <div key={i} className={styles.task_item}>
            <div className={styles.copy_buttons}>
              <button
                className={styles.copy_button}
                onClick={(e) => handleCopy(e, task.description)}
              >
                Copy task
              </button>
            </div>
            <p className={styles.task_title}>{task.title}</p>
            <pre className={styles.task_body}>{task.description}</pre>
          </div>
        ))}
      </section>
    </main>
  );
}
