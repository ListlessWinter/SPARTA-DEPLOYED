import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { GiGreekTemple } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/SideMenu.css";


const PlayerSideMenu = () => {

  const location = useLocation();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("auth")));

  // To Update the local data of users
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(`https://sparta-deployed.onrender.com/api/players/${user._id}`);
      const UpdateUser = await res.json();
      setUser(UpdateUser);
      localStorage.setItem("auth", JSON.stringify(UpdateUser));
    };
    fetchUser();
  }, [user]);

  return (
    <div className="sidemenu">

      <div className="sidemenu-logo">
        <img src="/SPARTA-Logo2.png" alt="Logo" className="logo-img" />
      </div>

      <ul className="sidemenu-list">
        <li className={location.pathname === "/dashboard" ? "active" : ""}>
          <Link to="/dashboard"> <RxDashboard /> Dashboard </Link>
        </li>

        <li className={location.pathname.includes("/profile") ? "active" : ""}>
          <Link to={`/${user?._id}/profile`}> <FaUserCircle /> User Profile </Link>
        </li>

        <li className={location.pathname === "/event" ? "active" : ""}>
          <Link to="/event"> <AiOutlineFire /> Event </Link>
        </li>

        <li className={location.pathname === "/pantheon" ? "active" : ""}>
          <Link to="/pantheon"> <GiGreekTemple /> Pantheon </Link>
        </li>
      </ul>

    </div>
  );
};

export default PlayerSideMenu;
