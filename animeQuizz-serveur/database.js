require('dotenv').config() ;
//console.log(process.env) ;
const { Pool } = require('pg');

// URL de connexion à PostgreSQL, récupérée depuis une variable d'environnement ou une valeur par défaut
const connectUrl = process.env.DATABASE_URL || "postgresql://postgres:mlrFOqPahYpBKHdPbvosPdSqmpYosMeH@monorail.proxy.rlwy.net:14637/railway";

// Création d'une instance de pool PostgreSQL avec l'URL de connexion
const pool = new Pool({
    connectionString: connectUrl
});

// Fonction pour créer la table "user" si elle n'existe pas
async function createUserTable() {
    const client = await pool.connect();
    try {
        // Requête pour créer la table "user" si elle n'existe pas déjà
        await client.query(`CREATE TABLE IF NOT EXISTS "user" (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        )`);
        console.log('Initialisation de la table "user"');
    } catch (e) {
        console.error('Erreur lors de la création de la table :', e);
        throw e;
    } finally {
        client.release();
    }
}

// Fonction pour ajouter un utilisateur
async function addUser(username, nom) {
    await createUserTable();
    const client = await pool.connect();
    try {
        const result = await client.query(`SELECT * FROM "user" WHERE username=$1`, [username]);

        if (result.rowCount >= 1) { throw new Error("Ce nom d'utilisateur est deja Utiliser") };

        await client.query(`INSERT INTO "user"(username, name) VALUES($1, $2)`, [username, nom]);

        console.log('Utilisateur ajouté avec succès');

    } catch (error) {

        console.error('Erreur lors de la sauvegarde d\'un utilisateur :', error);

        throw error;

    } finally {

        client.release();
    }
}


async function checkUsername(username) {

    await createUserTable();
    const client = await pool.connect();
    try {

        const result = await client.query(`SELECT * FROM "user" WHERE username=$1`, [username]);
        if (result.rowCount = 0 || !result.rowCount) return { status: 200, isregistered: false, message: "Nom d'utilisateur incorrect" };
        return { status: 200, isregistered: true, ...result.rows[0] };
    } catch (error) {
        console.error(error);
    }
    finally {
        client.release();
    }
}


async function createScoreTable() {

    const client = await pool.connect();

    try {
        await client.query(`CREATE TABLE IF NOT EXISTS score(
            id SERIAL PRIMARY KEY,
            player_id TEXT NOT NULL,
            quizz_id TEXT NOT NULL,
            player_score INTEGER,
            player_try_count INTEGER
        )`);
        console.log('Initialisation de la table score');
    } catch (e) {
        console.error('Erreur lors de la creation de la table score', e);
    } finally {
        client.release();
    }
}

async function registrePLayerScore(playerId, quizzId, score) {

    await createScoreTable();
    const client = await pool.connect();
    try {
    const rowCount = await getTryCount(playerId,quizzId) ;
        if (playerId == null || score == null) throw new Error('Les donnees ne doivent pas etes vide');
        client.query(`INSERT INTO "score"(player_id,quizz_id,player_score,player_try_count)VALUES($1,$2,$3,$4)`, [playerId,quizzId, score,rowCount + 1]);
        console.log(`le nouveau score de ${playerId} a ete sauvegarder`);

    } catch (e) {

        console.log(`erreur lors de la sauvegarde du score de ${playerId} :`, e);
    } finally {
        client.release() ;
    }
}

async function getTryCount(playerId, quizz_id) {

    const client = await pool.connect();

    try {
        const result = await client.query('SELECT * FROM "score" WHERE player_id=$1 AND quizz_id=$2', [playerId, quizz_id]);
        return result.rowCount;
    } catch (error) {
        console.error(error);
        return 0 ;
    } finally {
        client.release()
    }
}

// Initialisation du pool et création de la table lors du chargement du module
//createUserTable().catch(console.error);

module.exports = {
    addUser,
    checkUsername,
    registrePLayerScore
};
