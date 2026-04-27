import { useEffect } from 'react';
import api from '../utils/api';
import { useLoading } from '../context/LoadingContext';
import toast from 'react-hot-toast';

const ApiInterceptor = ({ children }) => {
    const { setLoading } = useLoading();

    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                setLoading(true);
                return config;
            },
            (error) => {
                setLoading(false);
                return Promise.reject(error);
            }
        );

        const responseInterceptor = api.interceptors.response.use(
            (response) => {
                setLoading(false);
                if (response.config.method !== 'get') {
                    toast.success(response.data.message || 'Action completed successfully!');
                }
                return response;
            },
            (error) => {
                setLoading(false);
                const message = error.response?.data?.message || error.message || 'Something went wrong';
                toast.error(message);
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [setLoading]);

    return children;
};

export default ApiInterceptor;
