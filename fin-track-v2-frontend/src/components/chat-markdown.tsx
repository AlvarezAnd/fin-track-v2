"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h3>,
  ul: ({ children }) => (
    <ul className="my-1.5 list-disc space-y-1 pl-4 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 list-decimal space-y-1 pl-4 first:mt-0 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="[&>p]:my-0">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1.5 border-l-2 border-black/20 pl-2 text-zinc-600 first:mt-0 last:mb-0 dark:border-white/20 dark:text-zinc-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-black/10 dark:border-white/15" />,
  pre: ({ children }) => (
    <pre className="my-1.5 overflow-x-auto rounded-lg bg-black/10 p-2 text-xs first:mt-0 last:mb-0 dark:bg-white/10">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-black/10 px-1 py-0.5 text-[0.85em] dark:bg-white/10">{children}</code>
    ),
  table: ({ children }) => (
    <div className="my-1.5 overflow-x-auto first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-black/15 px-1.5 py-1 text-left font-semibold dark:border-white/15">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-black/10 px-1.5 py-1 align-top dark:border-white/10">{children}</td>
  ),
  img: () => null,
};

export function ChatMarkdown({ texto }: { texto: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {texto}
    </ReactMarkdown>
  );
}
