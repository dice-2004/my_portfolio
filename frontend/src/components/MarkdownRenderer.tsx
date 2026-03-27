import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-prose w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-3xl font-extrabold mt-8 mb-4 border-b border-white/20 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" {...props} />,
          h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b border-white/10 pb-2 text-gray-100" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xl font-bold mt-6 mb-3 text-purple-200" {...props} />,
          p: ({ ...props }) => <p className="text-gray-300 leading-relaxed mb-6" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2 marker:text-purple-500" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal list-inside text-gray-300 mb-6 space-y-2 marker:text-pink-500" {...props} />,
          a: ({ ...props }) => <a className="text-purple-400 hover:text-pink-400 border-b border-purple-500/50 hover:border-pink-500 transition" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-white/5 rounded-r-lg italic text-gray-400 mb-6" {...props} />,
          code: ({ inline, ...props }: any) => 
            inline ? 
            <code className="bg-black/30 font-mono text-pink-300 px-1.5 py-0.5 rounded text-sm" {...props} /> :
            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl overflow-x-auto mb-6"><code className="font-mono text-sm text-gray-300" {...props} /></pre>,
          strong: ({ ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
          img: ({ ...props }) => <img className="rounded-xl shadow-2xl border border-white/10 my-8 max-h-[500px] object-cover mx-auto" alt={props.alt || "Markdown Image"} {...props} />,
          table: ({ ...props }) => <div className="overflow-x-auto mb-6"><table className="w-full text-left border-collapse" {...props} /></div>,
          th: ({ ...props }) => <th className="border-b border-white/20 pb-3 text-gray-200 font-bold p-3 bg-white/5" {...props} />,
          td: ({ ...props }) => <td className="border-b border-white/10 p-3 text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
