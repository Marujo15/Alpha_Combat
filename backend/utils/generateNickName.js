export function generateNickname(name) {
    //divide o nome em partes, se houver espaços:
    const nameParts = name.split(" ");
    
    //seleciona a primeira parte do nome e até duas primeiras letras da segunda (se existir):
    const baseNickname = nameParts[0] + (nameParts[1] ? nameParts[1].slice(0, 2) : "");
    
    //sera um número aleatório de 100 a 999 para adicionar um toque único:
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    
    //concatena e cria o apelido fina:
    const nickname = `${baseNickname}${randomNumber}`;
    
    return nickname;
}
