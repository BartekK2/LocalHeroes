import { createContext, useState, useEffect,useContext } from 'react';
import { AuthContext } from './AuthContext';



export const dataContext = createContext();


export const DataProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const API_URL = "http://localhost:5000";


    return (
        <dataContext.Provider value={{  }}>
            {children}
        </dataContext.Provider>
    );
};