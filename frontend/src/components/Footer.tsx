export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-dim sm:px-6">
        <p>© {year} Daisuke (dice)</p>
        <div className="flex gap-5">
          <a href="https://github.com/dice-2004" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
            GitHub
          </a>
          <a href="https://x.com/_dice_ke" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
