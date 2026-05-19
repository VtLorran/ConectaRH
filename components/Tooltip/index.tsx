interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  return (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-0 rounded bg-slate-950 p-2 text-xs font-semibold text-white shadow-md transition-all duration-150 origin-top group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none">
      {text}

      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 rotate-45"></div>
    </div>
  );
}
