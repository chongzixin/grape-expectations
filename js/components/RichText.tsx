export function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        const rendered = parts.map((p, pi) =>
          pi % 2 === 1 ? <strong key={pi} style={{ color: '#c9a84c' }}>{p}</strong> : p
        );
        return <span key={li}>{rendered}{li < lines.length - 1 && <br />}</span>;
      })}
    </span>
  );
}
