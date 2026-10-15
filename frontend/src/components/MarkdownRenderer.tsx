import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Markdown 本文の表示。色や余白は globals.css の .prose-site で決める。
// 生 HTML は react-markdown が既定で無効にしているので、ここでサニタイズは不要。
export default function MarkdownRenderer({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`prose prose-site max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
