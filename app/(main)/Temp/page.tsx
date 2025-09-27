// app/page.tsx
"use client";
import WordEditor from "../../Components/WordEditor";

export default function Word() {
  const handleContentChange = (content: string) => {
    console.log("Content changed:", content);
    // You can save the content to state or database here
  };

  return (
    <main>
      <WordEditor onContentChange={handleContentChange} />
    </main>
  );
}
