export function Button({ children }: any) {
  return (
    <button style={{ padding: "10px", background: "blue", color: "white" }}>
      {children}
    </button>
  );
}