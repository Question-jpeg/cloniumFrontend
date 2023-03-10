

export const getNewSocket = () => {
    return new WebSocket("ws://api.forest--house.ru:8000/ws/") 
}