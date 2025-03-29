-- Création de la table pour les matches multijoueur
CREATE TABLE IF NOT EXISTS multiplayer_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_name VARCHAR(50) NOT NULL,  -- (Morpion, PierreFeuilleCiseaux, JeuDesDes)
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    winner_id INT,                   -- NULL si match nul
    result VARCHAR(20) NOT NULL,     -- (victoire, défaite, égalité)
    session_id VARCHAR(50) NOT NULL, -- Identifiant unique de la session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- Création de la table pour les statistiques multijoueur
CREATE TABLE IF NOT EXISTS multiplayer_stats (
    player_id INT NOT NULL,
    game_name VARCHAR(50) NOT NULL,  -- (Morpion, PierreFeuilleCiseaux, JeuDesDes)
    matches_played INT DEFAULT 0,    -- Nombre total de parties jouées
    victories INT DEFAULT 0,         -- Nombre de victoires
    defeats INT DEFAULT 0,           -- Nombre de défaites
    draws INT DEFAULT 0,             -- Nombre d'égalités
    points INT DEFAULT 0,            -- Points de classement (3 pour victoire, 1 pour nul, 0 pour défaite)
    last_match_date TIMESTAMP,       -- Date du dernier match
    PRIMARY KEY (player_id, game_name),
    FOREIGN KEY (player_id) REFERENCES users(id)
);

-- Table pour stocker les confrontations entre joueurs
CREATE TABLE IF NOT EXISTS player_rivalries (
    player_id INT NOT NULL,
    opponent_id INT NOT NULL,
    game_name VARCHAR(50) NOT NULL,
    matches_played INT DEFAULT 0,    -- Nombre de confrontations
    victories INT DEFAULT 0,         -- Victoires contre cet adversaire
    defeats INT DEFAULT 0,           -- Défaites contre cet adversaire
    draws INT DEFAULT 0,             -- Égalités avec cet adversaire
    last_match_date TIMESTAMP,       -- Date de la dernière confrontation
    PRIMARY KEY (player_id, opponent_id, game_name),
    FOREIGN KEY (player_id) REFERENCES users(id),
    FOREIGN KEY (opponent_id) REFERENCES users(id)
);

-- Procédure stockée pour mettre à jour les statistiques après une partie multijoueur
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS update_multiplayer_stats(
    IN p_game_name VARCHAR(50),
    IN p_player1_id INT,
    IN p_player2_id INT,
    IN p_winner_id INT,
    IN p_result VARCHAR(20)
)
BEGIN
    DECLARE p1_points INT;
    DECLARE p2_points INT;
    
    -- Déterminer les points à attribuer
    IF p_result = 'égalité' THEN
        SET p1_points = 1;
        SET p2_points = 1;
    ELSEIF p_winner_id = p_player1_id THEN
        SET p1_points = 3;
        SET p2_points = 0;
    ELSEIF p_winner_id = p_player2_id THEN
        SET p1_points = 0;
        SET p2_points = 3;
    ELSE
        SET p1_points = 0;
        SET p2_points = 0;
    END IF;
    
    -- Mettre à jour les statistiques du joueur 1
    INSERT INTO multiplayer_stats (player_id, game_name, matches_played, victories, defeats, draws, points, last_match_date)
    VALUES (p_player1_id, p_game_name, 1, 
            CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
            CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
            CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
            p1_points, NOW())
    ON DUPLICATE KEY UPDATE
        matches_played = matches_played + 1,
        victories = victories + CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
        defeats = defeats + CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
        draws = draws + CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
        points = points + p1_points,
        last_match_date = NOW();
        
    -- Mettre à jour les statistiques du joueur 2
    INSERT INTO multiplayer_stats (player_id, game_name, matches_played, victories, defeats, draws, points, last_match_date)
    VALUES (p_player2_id, p_game_name, 1, 
            CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
            CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
            CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
            p2_points, NOW())
    ON DUPLICATE KEY UPDATE
        matches_played = matches_played + 1,
        victories = victories + CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
        defeats = defeats + CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
        draws = draws + CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
        points = points + p2_points,
        last_match_date = NOW();
        
    -- Mettre à jour les statistiques de rivalité (joueur 1 vs joueur 2)
    INSERT INTO player_rivalries (player_id, opponent_id, game_name, matches_played, victories, defeats, draws, last_match_date)
    VALUES (p_player1_id, p_player2_id, p_game_name, 1,
            CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
            CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
            CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
            NOW())
    ON DUPLICATE KEY UPDATE
        matches_played = matches_played + 1,
        victories = victories + CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
        defeats = defeats + CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
        draws = draws + CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
        last_match_date = NOW();
        
    -- Mettre à jour les statistiques de rivalité (joueur 2 vs joueur 1)
    INSERT INTO player_rivalries (player_id, opponent_id, game_name, matches_played, victories, defeats, draws, last_match_date)
    VALUES (p_player2_id, p_player1_id, p_game_name, 1,
            CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
            CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
            CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
            NOW())
    ON DUPLICATE KEY UPDATE
        matches_played = matches_played + 1,
        victories = victories + CASE WHEN p_winner_id = p_player2_id THEN 1 ELSE 0 END,
        defeats = defeats + CASE WHEN p_winner_id = p_player1_id THEN 1 ELSE 0 END,
        draws = draws + CASE WHEN p_result = 'égalité' THEN 1 ELSE 0 END,
        last_match_date = NOW();
END //
DELIMITER ; 