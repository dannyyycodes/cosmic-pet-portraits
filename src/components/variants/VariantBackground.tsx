interface VariantBackgroundProps {
  intensity?: 'calm' | 'normal' | 'excited';
  interactive?: boolean;
}

export const VariantBackground = ({ intensity: _intensity, interactive: _interactive }: VariantBackgroundProps = {}) => {
  return (
    <div className="fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: '#FFFDF5',
        }}
      />
    </div>
  );
};
