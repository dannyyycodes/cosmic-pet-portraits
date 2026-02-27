export const VariantBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(45 100% 91%) 0%, hsl(40 60% 87%) 50%, hsl(45 100% 91%) 100%)',
        }}
      />
    </div>
  );
};
