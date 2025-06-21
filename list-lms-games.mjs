import prisma from './src/lib/prisma.ts';

async function listLMSGames() {
    try {
        const lmsGames = await prisma.gameInstance.findMany({
            where: {
                game: {
                    slug: 'last-man-standing'
                }
            },
            include: {
                game: true
            }
        });

        console.log('Available Last Man Standing games:');
        lmsGames.forEach((game) => {
            console.log(`- ID: ${game.id}, Name: ${game.name}, Game: ${game.game.name}`);
            console.log(`  URL: http://localhost:3001/games/${game.game.slug}/${game.id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listLMSGames();
