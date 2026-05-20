/** CRM routes — ensure main area is always visible */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 w-full"
      style={{ minHeight: "calc(100vh - 8rem)", backgroundColor: "#0a0a0a" }}
    >
      {children}
    </div>
  );
}
