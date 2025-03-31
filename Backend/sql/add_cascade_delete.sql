-- Modifier les contraintes pour la table rankings
ALTER TABLE rankings 
DROP FOREIGN KEY rankings_ibfk_1;

ALTER TABLE rankings
ADD CONSTRAINT rankings_ibfk_1
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier les contraintes pour la table game_sessions
ALTER TABLE game_sessions 
DROP FOREIGN KEY game_sessions_ibfk_1;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_ibfk_1
FOREIGN KEY (player1_id)
REFERENCES users (id)
ON DELETE CASCADE;

ALTER TABLE game_sessions 
DROP FOREIGN KEY game_sessions_ibfk_2;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_ibfk_2
FOREIGN KEY (player2_id)
REFERENCES users (id)
ON DELETE CASCADE;

ALTER TABLE game_sessions 
DROP FOREIGN KEY game_sessions_ibfk_3;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_ibfk_3
FOREIGN KEY (winner_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier la contrainte pour la table player_progress
ALTER TABLE player_progress 
DROP FOREIGN KEY fk_user_id;

ALTER TABLE player_progress
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier la contrainte pour la table password_reset_tokens
ALTER TABLE password_reset_tokens 
DROP FOREIGN KEY password_reset_tokens_ibfk_1;

ALTER TABLE password_reset_tokens
ADD CONSTRAINT password_reset_tokens_ibfk_1
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier la contrainte pour la table reset_tokens
ALTER TABLE reset_tokens 
DROP FOREIGN KEY reset_tokens_ibfk_1;

ALTER TABLE reset_tokens
ADD CONSTRAINT reset_tokens_ibfk_1
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier les contraintes pour la table multiplayer_matches
ALTER TABLE multiplayer_matches 
DROP FOREIGN KEY multiplayer_matches_ibfk_1;

ALTER TABLE multiplayer_matches
ADD CONSTRAINT multiplayer_matches_ibfk_1
FOREIGN KEY (player1_id)
REFERENCES users (id)
ON DELETE CASCADE;

ALTER TABLE multiplayer_matches 
DROP FOREIGN KEY multiplayer_matches_ibfk_2;

ALTER TABLE multiplayer_matches
ADD CONSTRAINT multiplayer_matches_ibfk_2
FOREIGN KEY (player2_id)
REFERENCES users (id)
ON DELETE CASCADE;

ALTER TABLE multiplayer_matches 
DROP FOREIGN KEY multiplayer_matches_ibfk_3;

ALTER TABLE multiplayer_matches
ADD CONSTRAINT multiplayer_matches_ibfk_3
FOREIGN KEY (winner_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier la contrainte pour la table multiplayer_stats
ALTER TABLE multiplayer_stats 
DROP FOREIGN KEY multiplayer_stats_ibfk_1;

ALTER TABLE multiplayer_stats
ADD CONSTRAINT multiplayer_stats_ibfk_1
FOREIGN KEY (player_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Modifier les contraintes pour la table player_rivalries
ALTER TABLE player_rivalries 
DROP FOREIGN KEY player_rivalries_ibfk_1;

ALTER TABLE player_rivalries
ADD CONSTRAINT player_rivalries_ibfk_1
FOREIGN KEY (player_id)
REFERENCES users (id)
ON DELETE CASCADE;

ALTER TABLE player_rivalries 
DROP FOREIGN KEY player_rivalries_ibfk_2;

ALTER TABLE player_rivalries
ADD CONSTRAINT player_rivalries_ibfk_2
FOREIGN KEY (opponent_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Si d'autres tables ont des références à users, ajoutez des instructions similaires ici
-- Par exemple pour la table game_sessions (si elle existe et a une référence)
-- ALTER TABLE game_sessions 
-- DROP FOREIGN KEY fk_user_id_game;
-- 
-- ALTER TABLE game_sessions
-- ADD CONSTRAINT fk_user_id_game
-- FOREIGN KEY (user_id)
-- REFERENCES users (id)
-- ON DELETE CASCADE;

-- Répétez pour toutes les autres tables qui référencent users 