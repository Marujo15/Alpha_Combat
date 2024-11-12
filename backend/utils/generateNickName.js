export function generateNickname(name) {
    const nameParts = name.split(" ");
    
    const baseNickname = nameParts[0] + (nameParts[1] ? nameParts[1].slice(0, 2) : "");
    
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    
    const nickname = `${baseNickname}${randomNumber}`;
    
    return nickname;
}
