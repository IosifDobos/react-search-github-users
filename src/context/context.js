import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();
// createContext() gives access to the Provider and Consumer wich can be used in the application
const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);
    //request loading 
    const [requests, setRequests] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    // user error checking
    const [error, setError] = useState({ show: false, msg: '' })
    //check limit rate
    const checkRequest = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining }, } = data;
                setRequests(remaining)
                if (remaining === 0) {
                    // throw error
                    toggleError(true, 'sorry you have exceeded  your hourly rate limit')
                }
            })
            .catch((err) => console.log(err))
    }

    // error handling
    function toggleError(show = false, msg = '') {
        setError({ show, msg })
    }

    // search for github users
    const searchGithubUser = async (user) => {
        // toggle error
        toggleError();
        setIsLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`).catch((err) => console.log(err))
        // check if response is true
        if (response) {
            setGithubUser(response.data)
            // add user data dinamically
            const { login, followers_url } = response.data

            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`),
            ])
                .then((results) => {
                    const [repos, followers] = results;
                    const status = 'fulfield'
                    if (repos.status === status) {
                        setRepos(repos.value.data)
                    }
                    if (followers.status === status) {
                        setFollowers(followers.value.data)
                    }
                })
                .catch((err) => console.log(err));
        }
        else {
            //toggle error
            toggleError(true, 'there is no username matching your criteria')
        }
        checkRequest();
        setIsLoading(false);
    }

    useEffect(checkRequest, [])

    return <GithubContext.Provider
        value={{
            githubUser,
            repos,
            followers,
            requests,
            error,
            searchGithubUser,
            isLoading
        }}
    >
        {children}
    </GithubContext.Provider>
}

export { GithubProvider, GithubContext }
