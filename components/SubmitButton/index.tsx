interface Props {
  className?: string;
  text: string;
  disabled?: boolean; // Ajustado para boolean (opcional, caso não seja passado)
}

export default function SubmitButton({
  className = "",
  text,
  disabled,
}: Props) {
  return (
    <button
      type="submit" 
      disabled={disabled} 
      className={`bg-[linear-gradient(to_right,#2f5fd0,#2ec4b6)] 
        rounded-2xl shadow-lg 
        w-full p-4 text-white font-semibold text-sm
        transition-all duration-300 
        hover:brightness-110 hover:scale-[1.01]
        disabled:opacity-50 disabled:pointer-events-none disabled:scale-100
        ${className}`}
    >
      {text}
    </button>
  );
}
