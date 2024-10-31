export const formatTimePlayed = (time) => {
    if (time && time.trim() !== '') {
        const minutes = parseInt(time, 10);
        return `00:${minutes.toString().padStart(2, '0')}:00`;
    }
    return '00:00:00';
};
