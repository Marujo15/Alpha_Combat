import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(UserContext);

    // useEffect(() => {
    //     if (!user) {
    //       navigate("/login");
    //     }

    //     console.log("User logged in:", user);
    //   }
    // , [user, navigate]);

    const handleStartGame = () => {
        console.log("Starting game...");
        // Verifies if waiting queue has player
        // if true, make request to start match and navigate to room
        // else, add player to waiting queue
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem("token");
        navigate("/login");
      };

    return (
        <div className='dash-page-main-div'>
            <div className='dash-page-div'>
                {/* <div className='find-game-div'> */}
                    <p className='text'>ENCONTRAR JOGO</p>
                    <Button type="submit" className={"create-room-btn"} onClick={() => {DashboardPage}}></Button>
                {/* </div> */}
                {/* <div className='code-name-div'> */}
                    <p className='text'>OU INSIRA UM CÓDIGO:</p>
                    <Input className="room-id-input" type="text" placeholder={"CÓDIGO DA SALA"} onChange={(e) => setRoomId(e.target.value)}></Input>
                    <Button type="submit" className={"start-game-btn"} onClick={() => {handleStartGame}}></Button>
                {/* </div> */}
                <div>
                    <Button type="submit" className={"ranking-btn"} onClick={() => navigate('/rankings')}></Button>
                    <Button type="submit" className={"tutorial-btn"} onClick={() => navigate('/tutorial')}></Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;