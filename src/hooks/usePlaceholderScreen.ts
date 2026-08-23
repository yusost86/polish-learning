import { useNavigate } from "react-router-dom";

export interface UsePlaceholderScreenResult {
  onBack: () => void;
}

export function usePlaceholderScreen(): UsePlaceholderScreenResult {
  const navigate = useNavigate();
  return { onBack: () => navigate("/") };
}
