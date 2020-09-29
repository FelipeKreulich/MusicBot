const Discord = require('discord.js');
const {TOKEN_DISCORD} = require('./config.js');
const Ytdl = require('ytdl-core');
const Ytsr = require('ytsr');
const app = new Discord.Client();

const prefixoComando = '!'; // select your prefix

var servidores = {};

app.on('ready', () => {
    console.log('Estou Conectado!');
});

app.on('message', async (msg) => {
    // !leave = the bot leaves the voice channel
    let args = msg.content.split(' ').slice(1);
    if (msg.content === `${prefixoComando}leave`){
        if (msg.member.voice.channel){
            msg.member.voice.channel.leave();
            delete servidores[msg.guild.id];
            console.log(`Servidor saindo!\nNome do servidor: ${msg.guild.name}\n`);
        }
        else {
            msg.channel.send('Você precisa estar conectado a um Canal de Voz!');
        }
    }

    // !play [link] = bot playing music
    else if (msg.content.startsWith(`${prefixoComando}play `)){

        if(!Object.keys(servidores).includes(msg.guild.id)) servidores[msg.guild.id] = {
            "list": [],
            "connection": "",
            'playing': false
        };

        let oQueTocar = args[0];
        var vLink = oQueTocar.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        console.log(`Servidor ${msg.guild.name.toUpperCase()} insere comando PLAY usando: ${oQueTocar}.\n`);
        try { // try to find music by link
            if(vLink !== null) {
                console.log('link')
                servidores[msg.guild.id]['list'].push({nome: 'No name', link: oQueTocar});
                return tocarMusica(msg)
            } else throw 'no link found';
        } catch (error) {
            console.log('error', error);
            try { // tries to find music by searching
                let reason = (args.length > 0) ? msg.content.split(' ').splice(1).join(' ') : args[0];
                var options = {
                    limit: 5,
                    nextpageRef: `https://www.youtube.com/results?search_query=${reason}&sp=EgIQAQ%253D%253D`,
                }

                let videosPesquisados = await Ytsr(null, options);
                let videos = '';
                let nomes = [];
                let link;
                let nome;
                for (let i in videosPesquisados.items){
                    //console.log(videosPesquisados.items[i]);
                    videos += `**${Number(i) + 1}** - ${videosPesquisados.items[i].title}\n`;
                    nomes.push(videosPesquisados.items[i].title);
                    
                }
                //console.log(videos);
                const embed = new Discord.MessageEmbed()
                .setColor('') // select your color 
                .setTitle('BOT Music 🎶') // select you tile
                .setThumbnail('') // Select your image
                .setDescription('') // select yout description
                .addField('**Musicas:**', videos, true)
                .setTimestamp()
                msg.channel.send(embed).then( async (embedMessage) => {
                    await embedMessage.react('1️⃣');
                    await embedMessage.react('2️⃣');
                    await embedMessage.react('3️⃣');
                    await embedMessage.react('4️⃣');
                    await embedMessage.react('5️⃣');
                    const filter = (reaction, user) => {
                        return ['5️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣'].includes(reaction.emoji.name)
                            && user.id === msg.author.id;
                    }
                    let collector = embedMessage.createReactionCollector(filter, {time: 20000});
                    collector.on('collect', async (reaction, rectionCollector) => {
                        if (reaction.emoji.name === '5️⃣'){
                            msg.channel.send('Reagiu com 5️⃣');
                            nome = nomes[4];
                            link = videosPesquisados.items[4].link
                        }
                        else if (reaction.emoji.name === '1️⃣'){
                            msg.channel.send('Reagiu com 1️⃣');
                            nome = nomes[0];
                            link = videosPesquisados.items[0].link
                        }
                        else if (reaction.emoji.name === '2️⃣'){
                            msg.channel.send('Reagiu com 2️⃣');
                            nome = nomes[1];
                            link = videosPesquisados.items[1].link
                        }
                        else if (reaction.emoji.name === '3️⃣'){
                            msg.channel.send('Reagiu com 3️⃣');
                            nome = nomes[2];
                            link = videosPesquisados.items[2].link
                        }
                        else if (reaction.emoji.name === '4️⃣'){
                            msg.channel.send('Reagiu com 4️⃣');
                            nome = nomes[3];
                            link = videosPesquisados.items[3].link
                        }
                        servidores[msg.guild.id]["list"].push({nome: nome, link: link});

                        if (servidores[msg.guild.id]["list"].length > 0) {
                            tocarMusica(msg);
                        }
                    });
                }); 
            } catch (error2) { // search returned nothing
                console.log(error2);
                msg.channel.send('Nenhum vídeo foi encontrado!');
            }
        }
    }

    // !pause = Bot pauses and resumes music
    if (msg.content === `${prefixoComando}pause`){
        
        if (msg.member.voice.channel){
            let dispact = (servidores[msg.guild.id]['connection']) ? servidores[msg.guild.id]["connection"] : '';
            if (dispact){
                if (dispact.paused) dispact.resume(), msg.reply('O BOT voltou a Tocar!'); 
                else dispact.pause(), msg.reply('O BOT foi Pausado!'); ;
            } else return msg.channel.send('Eu não estou em um canal de voz!');
        }
        else return msg.channel.send('Você precisa estar conectado a um Canal de Voz!');
    }

    // !skip = Bot plays the next song in the queue
    else if (msg.content === `${prefixoComando}skip`){
        if (msg.member.voice.channel){
            let dispatcher = (servidores[msg.guild.id]['connection']) ? servidores[msg.guild.id]['connection'] : '';
            let musics = servidores[msg.guild.id]['list'];
            if (dispatcher){
                if(musics.length > 1) {
                    
                    dispatcher.end();
                    msg.reply('Pulando para a proxima música!');
                } else return msg.channel.send('Não há outra música na lista!');
            } else msg.channel.send('Eu não estou em um canal de voz.');
        }
        else {
            msg.channel.send('Você precisa estar conectado a um Canal de Voz!');
        }
    }
    // !q - Shows the songs that are in the queue
    else if (msg.content === `${prefixoComando}q`){
        let musics = '';

        if(servidores[msg.guild.id] && servidores[msg.guild.id]["list"].length > 0) {
            
            for(i = 0; i < servidores[msg.guild.id]['list'].length; i++) {
                let nome = servidores[msg.guild.id]["list"][i].nome; 
                musics += i + '- | ' + nome
            }
        }else return msg.channel.send('Não há musicas não lista.');

        console.log(servidores[msg.guild.id]['list'])

        msg.channel.send('Musicas na lista: ' + musics)
    }
    // Info - Tells the details of the currently active song
    else if(msg.content === `${prefixoComando}info`) {
        //console.log(servidores[msg.guild.id])
        if(!servidores[msg.guild.id] || servidores[msg.guild.id]["list"].length == 0) return msg.channel.send('não há nenhuma musica tocando') 
        Ytdl.getBasicInfo(servidores[msg.guild.id]["list"][0].link, (err, info) => {
            if(err) return msg.channel.send('err', err);
            let v = info.player_response.videoDetails;
            msg.channel.send(`Nome: ${v.title}\nID: ${v.viewCount}\nDuração: ${v.lengthSeconds}\nAutor: ${v.author}\nThumbnail: ${v.thumbnail[0]}\n Views: ${v.viewCount}`)
        })
    }
    else if(msg.content === `${prefixoComando}help`) {
        const embed = new Discord.MessageEmbed()
        .setTitle('**COMANDOS DO BOT:**')
        .setColor('#ea1313')
        .setDescription('**!play <nomedamusica>** - *O BOT irá tocar a música selecionada.*\n**!leave** - *O BOT irá sair do canal de voz.*\n**!pause** - *O BOT irá pausar e despausar a Música ativa no momento.*\n**!skip** - *O BOT irá tocar a próxima música da fila.*\n**!info** - *O BOT irá informar os detalhes da música ativa no momento.*')
        msg.channel.send(embed)
    }
});

async function tocarMusica(msg){
    if (msg.member.voice.channel){
        let playing = servidores[msg.guild.id]["playing"];

        msg.member.voice.channel.join().then(connection => {
            let playingMusic = servidores[msg.guild.id]["list"][0].link;
            if(servidores[msg.guild.id]["list"][0].nome == "No name") {
                Ytdl.getBasicInfo(playingMusic, (err, info) => { 
                    if(err) console.log(err); 
                    servidores[msg.guild.id]["list"][0].nome = info.player_response.videoDetails.title
                })
            }

            if(servidores[msg.guild.id]["playing"] == false) {
                let dispacther = connection.play(Ytdl(playingMusic, {filter: "audioonly"}))

                dispacther.on('finish', () => {
                    servidores[msg.guild.id]["playing"] = false;
                    if (servidores[msg.guild.id]['list'].length > 0){
                        tocarMusica(msg);
                        servidores[msg.guild.id]['list'].shift()
                    }
                })
                dispacther.on('start', () => {
                    servidores[msg.guild.id]["playing"] = true;
                    servidores[msg.guild.id]['connection'] = dispacther;
                    msg.channel.send('Tocando musica: ``' + playingMusic + "``");
                })

                dispacther.on('error', (e) => {
                    console.log(e);
                    msg.channel.send('Um erro aconteceu! Pulando para a próxima musica!');
                    dispacther.end();
                })
            }
        }).catch(e => {
            console.log('error', e);
        });
    }else msg.channel.send('Você precisa estar conectado a um canal de Voz!');
}

app.login(TOKEN_DISCORD);
