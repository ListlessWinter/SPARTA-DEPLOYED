import { LayoutDashboard, CircleUserRound, Flame, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { API_URL } from "../config";

const PlayerSideMenu = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("auth")));

  // Refresh the stored player data once per mount
  useEffect(() => {
    if (!user?._id) return;
    const fetchUser = async () => {
      const res = await fetch(`${API_URL}/api/players/${user._id}`);
      if (!res.ok) return;
      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem("auth", JSON.stringify(updatedUser));
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: `/${user?._id}/profile`, label: "Profile", icon: CircleUserRound, match: (p) => p.includes("/profile") },
    { to: "/event", label: "Events", icon: Flame, match: (p) => p.startsWith("/event") },
    { to: "/pantheon", label: "Pantheon", icon: Landmark, match: (p) => p.startsWith("/pantheon") },
  ];

  return <Sidebar items={items} />;
};

export default PlayerSideMenu;
