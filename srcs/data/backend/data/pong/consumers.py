import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db import models
import asyncio
from pong.classGame import PongGame, list_of_games
from pong.classTournament import Tournament, list_of_tournaments
from . import initValues as iv

# File d'attente pour le matchmaking
waiting_players = []
invitational_games = []

@sync_to_async
def create_game(player_1, player_2):
    from pong.models import Game
    return Game.objects.create(player_1=player_1, player_2=player_2, is_active=True)


class CLIPongConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        # Accept the WebSocket connection
        await self.accept()
        from api.models import User_site
        player = User_site
        player.nickname = 'anonymous_player'
        #envoyer juste un signal 'connected' pour dire que le joueur est connecte
        await self.send(text_data=json.dumps({
            'connected': 'connected'}))
        await self.findMatch(player)

    # cree une partie si le joueur est le premier a se connecter ou rejoint une partie si un autre joueur est deja connecte. return cette partie
    async def findMatch(self, player):
        if (len(list_of_games) == 0) :
            await self.send(text_data=json.dumps({
                'game created': 'game first player'}))
            game = PongGame(player)
            list_of_games.append(game)
            game.status = "waiting"
            game.player_1 = player
            game.nbPlayers += 1
            game.channel_player_1 = self.channel_name
            self.game = game
            self.periodic_state_update_task = asyncio.create_task(self.periodic_state_update())
        else :
            game = list_of_games.pop(0)
            game.player_2 = player
            game.nbPlayers += 1   
            game.channel_player_2 = self.channel_name
            self.game = game
            self.periodic_state_update_task = asyncio.create_task(self.periodic_state_update())

        if(game.nbPlayers == 2) :
            await self.send(text_data=json.dumps({
                'game created' :  self.game.player_1.nickname + ' and ' + self.game.player_2.nickname}))
            await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_1)
            await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_2)
            game.status = "ready"
            self.task = asyncio.create_task(self.game.game_loop())

        return game

    async def periodic_state_update(self):
        if hasattr(self, 'game') and self.game is not None:
            while self.game.winner is None:
                await asyncio.sleep(3)
                if hasattr(self, 'game') and self.game is not None:
                    if self.game.is_active:
                        await self.state_of_the_game()
       
    async def game_state(self, event):
        pass

    async def state_of_the_game(self):
        await self.send(text_data=json.dumps({
            'action_type': 'state_of_the_game',
            'game': {
                'ball_position': {
                    'x': self.game.ball_position_x,
                    'y': self.game.ball_position_y
                },
                'players': {
                    'player_1': {
                        'name': self.game.player_1.nickname,
                        'position': self.game.player_1_position,
                        'score': self.game.player_1_score
                    },
                    'player_2': {
                        'name': self.game.player_2.nickname,
                        'position': self.game.player_2_position,
                        'score': self.game.player_2_score
                    }
                }
            }
        }))

    async def define_player(self, event):
        pass

    async def start_game(self, event):
        pass
    
    async def disconnect(self, code):
        # Retirer le joueur de la file d'attente s'il quitte la connexion
        from api.models import User_site
        player = User_site
        player.nickname = 'anonymous_player'
        if player in waiting_players:
            waiting_players.remove(player)
        
        if hasattr(self, 'game') and self.game is not None:
            if self.game.status == "ready":
                if self.game.winner is None:
                    if self.game.player_1 == player:
                        self.game.winner = self.game.player_2
                        self.game.loser = self.game.player_1
                    else:
                        self.game.winner = self.game.player_1
                        self.game.loser = self.game.player_2
                    await self.channel_layer.group_discard(f"game_{self.game.id}", self.channel_name)
                    self.game.reset_ball()
                    await self.game.broadcastState()
                    await self.game.stop_game()
            await self.channel_layer.group_discard(f"game_{self.game.id}", self.channel_name)
            
            if self.game in list_of_games :
                list_of_games.remove(self.game)
            self.game = None
            
        await self.close()

    async def receive(self, text_data):
        print("Received text_data:", text_data)
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError: {e}")
            return
   
        from api.models import User_site
        player = User_site
        player.nickname = 'anonymous_player'
        if data['type'] == 'up':
            if hasattr(self, 'game') and self.game is not None and self.game.is_active :
                if self.game.player_1 == player:
                    self.game.move_player('player_1', 'up')
                else:
                    self.game.move_player('player_2', 'up')
        if data['type'] == 'down':
            if hasattr(self, 'game') and self.game is not None and self.game.is_active :
                if self.game.player_1 == player:
                    self.game.move_player('player_1', 'down')
                else:
                    self.game.move_player('player_2', 'down')
        if data['type'] == 'stop up':
            if hasattr(self, 'game') and self.game is not None and self.game.is_active :
                if self.game.player_1 == player:
                    self.game.move_player('player_1', 'stop up')
                else:
                    self.game.move_player('player_2', 'stop up')
        if data['type'] == 'stop down':
            if hasattr(self, 'game') and self.game is not None and self.game.is_active :
                if self.game.player_1 == player:
                    self.game.move_player('player_1', 'stop down')
                else:
                    self.game.move_player('player_2', 'stop down')
        if data['type'] == 'state_of_the_game':
            await self.state_of_the_game()
        if data['type'] == 'stop_game' :
            if hasattr(self, 'game') and self.game is not None and self.game.is_active :
                if self.game.player_1 == player:
                    self.game.winner = self.game.player_2
                    self.game.loser = self.game.player_1
                else:
                    self.game.winner = self.game.player_1
                    self.game.loser = self.game.player_2
                await self.game.broadcastState()
                await self.game.stop_game()
        if data['type'] == 'disconnect_player' :
            await self.disconnect(1000)

    async def end_of_game(self, event):
        pass
        # if event['winner'] == 'anonymous_player':
        #     result = 'win'
        #     nb_point_taken = event['score_winner']
        #     nb_point_given = event['score_loser']
        # else :
        #     result = 'lose'
        #     nb_point_taken = event['score_loser']
        #     nb_point_given = event['score_winner']
        # if self.channel_name is not None:
        #     await self.send(text_data=json.dumps({
        #         'action_type': 'end_of_game',
        #         'winner': event['winner'],
        #         'result': result,
        #         'nb_point_taken' : nb_point_taken,
        #         'nb_point_given' : nb_point_given
        #     }))
        # self.game = None


class PongConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Accept the WebSocket connection
        await self.accept()

        # Add player to the matchmaking queue
        player = self.scope['user']
        if player.is_authenticated:
            await self.findMatch(player)
        else:
            await self.close()

    # cree une partie si le joueur est le premier a se connecter ou rejoint une partie si un autre joueur est deja connecte. return cette partie
    async def findMatch(self, player):
        # print("consumer invitational games : ", invitational_games)
        for game in invitational_games:
            if game.player_1 == player:
                # print("consumer create invitation game with user : ", player)
                game.channel_player_1 = self.channel_name
                self.game = game
                self.game.nbPlayers += 1
                self.game.status = "waiting"
            if game.player_2 == player:
                # print("consumer join invitation game with user : ", player)
                game.channel_player_2 = self.channel_name
                self.game = game
                self.game.nbPlayers += 1
                self.game.status = "waiting"
            if game.nbPlayers == 2:
                game_database = await create_game(game.player_1, game.player_2)
                game.id = game_database.id
                game_database.is_active = True
                await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_1)
                await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_2)
                game.status = "ready"
                invitational_games.remove(game)
                self.task = asyncio.create_task(self.game.game_loop())
            return game

        if (len(list_of_games) == 0) :
            # print("consumer create game with user : ", player)
            game = PongGame(player)
            list_of_games.append(game)
            game.status = "waiting"
            game.player_1 = player
            game.nbPlayers += 1
            game.channel_player_1 = self.channel_name
            self.game = game
            # await self.send_waiting()
        else :
            for game in list_of_games:
                if game.player_1 == player or game.player_2 == player:
                    return
            # print("consumer join game with user : ", player)
            game = list_of_games.pop(0)
            game.player_2 = player
            game.nbPlayers += 1   
            game.channel_player_2 = self.channel_name
            self.game = game

        if(game.nbPlayers == 2) :
            # print("consumer game with 2 players")
            if game.player_1.nickname != 'anonymous_player' and game.player_2.nickname != 'anonymous_player':
                game_database = await create_game(game.player_1, game.player_2)
                game.id = game_database.id
                game_database.is_active = True
            await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_1)
            await self.channel_layer.group_add(f"game_{game.id}", game.channel_player_2)
            game.status = "ready"
            self.task = asyncio.create_task(self.game.game_loop())
        return game

    async def send_waiting(self):
        # print("consumer send waiting for player")
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'waiting_for_player',
                'game': {
                    'ball_position': {
                        'x': self.game.ball_position_x,
                        'y': self.game.ball_position_y
                    },
                    'player_1_position': self.game.player_1_position,
                    'player_2_position': self.game.player_2_position
                }
            }))

    async def game_state(self, event):
        # print("game state user : ", self.scope['user'])
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'game_state',
                'game': event['game']
            }))

    async def define_player(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'define_player',
                'name_player': event['name_player'],
                'current_player': event['current_player'],
                'game': event['game']
            }))

    #fonction pour envoyer start_game aux front par les deux joueurs, met la game en active, passe le statut en PLAYING
    async def start_game(self, event):
        # print("consumer start game user : ", self.scope['user'])
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'start_game',
                'game': event['game']
            }))

    async def disconnect(self, code):
        # Retirer le joueur de la file d'attente s'il quitte la connexion
        # print("consumer disconnect user : ", self.scope['user'])
        player = self.scope['user']
        if player in waiting_players:
            waiting_players.remove(player)
        
        if hasattr(self, 'game') and self.game is not None:
            if self.game.status == "waiting":
                if self.game.player_1 == player:
                    self.game.player_1 = None
                    self.game.nbPlayers -= 1
                    self.game.channel_player_1 = None
                elif self.game.player_2 == player:
                    self.game.player_2 = None
                    self.game.nbPlayers -= 1
                    self.game.channel_player_2 = None
            if self.game.status == "ready":
                if self.game.winner is None:
                    if self.game.player_1 == player:
                        self.game.winner = self.game.player_2
                        self.game.loser = self.game.player_1
                    else:
                        self.game.winner = self.game.player_1
                        self.game.loser = self.game.player_2
                    await self.channel_layer.group_discard(f"game_{self.game.id}", self.channel_name)
                    self.game.reset_ball()
                    await self.game.broadcastState()
                    await self.game.stop_game()
            await self.channel_layer.group_discard(f"game_{self.game.id}", self.channel_name)
            
            if self.game in list_of_games :
                list_of_games.remove(self.game)
            if self.game in invitational_games :
                invitational_games.remove(self.game)
            self.game = None
            
        await self.close()

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Update player positions or handle key events
        if data['type'] == 'update_player_position':
            if hasattr(self, 'game') and self.game is not None and self.game.is_active:
                self.game.move_player(data['player'], data['move'])
        # if data['type'] == 'game_started':
        #     await self.game.is_active = True
        if data['type'] == 'stop_game' :
            player = self.scope['user']
            if self.game.player_1 == player:
                self.game.winner = self.game.player_2
                self.game.loser = self.game.player_1
            else:
                self.game.winner = self.game.player_1
                self.game.loser = self.game.player_2
            await self.game.broadcastState()
            await self.game.stop_game()
        if data['type'] == 'disconnect_player' :
            # print("disconnect player in consumer pong : ", self.scope['user'])
            await self.disconnect(1000)

    async def end_of_game(self, event):
        if event['winner'] == self.scope['user'].nickname:
            result = 'win'
            nb_point_taken = event['score_winner']
            nb_point_given = event['score_loser']
        else :
            result = 'lose'
            nb_point_taken = event['score_loser']
            nb_point_given = event['score_winner']
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'end_of_game',
                'winner': event['winner'],
                'result': result,
                'nb_point_taken' : nb_point_taken,
                'nb_point_given' : nb_point_given
            }))
        self.game = None



#class tournament consumer qui va avec la class TournamentGame, en attendant les autres, a partir de 4, le tournoi peut commencer
class TournamentConsumer(AsyncWebsocketConsumer):

    players = []

    async def connect(self):
        await self.accept()

        player = self.scope['user']
        # print("user : ", self.scope['user'])
        if player.is_authenticated:
            await self.findTournament(player)
        else:
            await self.close()

    async def websocket_send(self, event):
        text_data = event['text']
        await self.send(text_data=text_data)

    async def findTournament(self, player):
        if (len(list_of_tournaments) == 0) :
            # print("create tournament with user : ", player)
            tournament = Tournament()
            list_of_tournaments.append(tournament)
            self.tournament = tournament
            self.tournament.status = "waiting"
        if (list_of_tournaments[0].nbPlayers < 4) :
            self.tournament = list_of_tournaments[0]
            for player_in_tournament in list_of_tournaments[0].player:
                if player_in_tournament == player:
                        # print("consumer player already in THIS tournament")
                        return
            for i in range(4):
                if self.tournament.player[i] is None:
                    # print("join tournament with user : ", player)
                    self.tournament.player[i] = player
                    self.tournament.channel_layer_player[i] = self.channel_name
                    # print("channel layer : ", self.tournament.channel_layer_player[i], "for player : ", self.tournament.player[i])
                    self.tournament.nbPlayers += 1
                    self.current_player = 'player_' + str(i+1)
                    await self.update_player_list(self.tournament)
                    break
        # else :
            # print("consumer error no tournament available")
        if(self.tournament.nbPlayers == 4) :
            list_of_tournaments.pop(0)
            # print("tournament with 4 players")
            tournament_database = await create_tournament(self.tournament.player[0], self.tournament.player[1], self.tournament.player[2], self.tournament.player[3])
            self.tournament.id = tournament_database.id
            tournament_database.is_active = True
            await self.channel_layer.group_add(f"tournament_{self.tournament.id}", self.tournament.channel_layer_player[0])
            await self.channel_layer.group_add(f"tournament_{self.tournament.id}", self.tournament.channel_layer_player[1])
            await self.channel_layer.group_add(f"tournament_{self.tournament.id}", self.tournament.channel_layer_player[2])
            await self.channel_layer.group_add(f"tournament_{self.tournament.id}", self.tournament.channel_layer_player[3])
            self.tournament.status = "ready"
            self.task = asyncio.create_task(self.tournament.start_tournament())
        return self.tournament

    async def disconnect(self, code):
        # print("consumer tournament disconnect user : ", self.scope['user'])
        player = self.scope['user']
        if hasattr(self, 'tournament') and self.tournament is not None:
            if player in self.tournament.player:
                # print("consumer tournament disconnect player in tournament")
                # print("consumer tournament status : ", self.tournament.status)
                if hasattr(self, 'tournament_id'):
                    await self.channel_layer.group_discard(f"tournament_{self.tournament_id}", self.channel_name)
                if self.tournament.status == "waiting":
                    self.tournament.player[self.tournament.player.index(player)] = None
                    self.tournament.nbPlayers -= 1
                    for i in range(4):
                        if self.tournament.channel_layer_player[i] == self.channel_name:
                            self.tournament.channel_layer_player[i] = None
                            break
                    await self.update_player_list(self.tournament)
                elif self.tournament.status == "semi_finals" or self.tournament.status == "finals":
                    if self.tournament.status == "semi_finals" :
                        if player == self.tournament.semi_finals1.player_1 or player == self.tournament.semi_finals1.player_2:
                            game = self.tournament.semi_finals1
                        elif player == self.tournament.semi_finals2.player_1 or player == self.tournament.semi_finals2.player_2:
                            game = self.tournament.semi_finals2
                    elif self.tournament.status == "finals" :
                        if player == self.tournament.final.player_1 or player == self.tournament.final.player_2:
                            game = self.tournament.final
                        elif player == self.tournament.small_final.player_1 or player == self.tournament.small_final.player_2:
                            game = self.tournament.small_final
                    # print("consumer disconnect game : ", game)
                    if game.winner is None:
                        if game.player_1 == player:
                            game.winner = game.player_2
                            game.loser = game.player_1
                        else:
                            game.winner = game.player_1
                            game.loser = game.player_2
                    game.reset_ball()
                    await self.channel_layer.group_discard(f"game_{game.id}", self.channel_name)
                    await game.broadcastState()
                    await game.stop_game()
                    self.tournament.resigned_players.append(player)

            if self.tournament in list_of_tournaments and self.tournament.nbPlayers == 0:
                list_of_tournaments.remove(self.tournament)
            self.tournament = None
        await self.close()

    async def update_player_list(self, event):
        players_in_tournament = [
            player for player in self.tournament.player if player is not None
        ]
        for i, player in enumerate(players_in_tournament):
            if self.tournament.channel_layer_player[i] is not None:
                await self.channel_layer.send(self.tournament.channel_layer_player[i], {
                    "type": "websocket.send",
                    'text': json.dumps({
                        'action_type': 'update_player_list',
                        'current_player': f'player_{i + 1}',
                        'players': [
                            {'nickname': p.nickname, 'id': p.id}
                            for p in players_in_tournament
                        ]
                    })
                })
        if event.nbPlayers == 0:
            # print("No player left in the tournament")
            return

    async def start_tournament(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'start_tournament',
            }))

    async def show_game(self, event):
        # print("consumer tournament show game user : ", self.scope['user'])
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'show_game',
            }))

    async def start_game(self, event):
        # print("consumer tournament start game user : ", self.scope['user'])
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'start_game',
                'game': event['game']
            }))

    async def game_state(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'game_state',
                'game': event['game']
            }))

    async def define_player(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'define_player',
                'name_player': event['name_player'],
                'current_player': event['current_player'],
                'game': event['game']
            }))
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'update_player_position':
            self.tournament.move_player(data['player'], data['move'], data['player_name'], data['game'])
        if data['type'] == 'stop_game' :
            await self.tournament.stop_game(data['game'])
        if data['type'] == 'disconnect_player' :
            # print("disconnect player in consumer tournament : ", self.scope['user'])
            await self.disconnect(1000)

    async def end_of_game(self, event):
        if event['winner'] == self.scope['user'].nickname:
            result = 'win'
            nb_point_taken = event['score_winner']
            nb_point_given = event['score_loser']
        else :
            result = 'lose'
            nb_point_taken = event['score_loser']
            nb_point_given = event['score_winner']
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'end_of_game',
                'winner': event['winner'],
                'result': result,
                'nb_point_taken' : nb_point_taken,
                'nb_point_given' : nb_point_given
            }))

    async def final_results(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'final_results',
                'ranking': event['ranking']
            }))

    async def end_of_tournament(self, event):
        if self.channel_name is not None:
            await self.send(text_data=json.dumps({
                'action_type': 'end_of_tournament',
            }))
        self.tournament = None
        # self.disconnect(1000)

@sync_to_async
def create_tournament(player_1, player_2, player_3, player_4):
    from pong.models import Tournament
    return Tournament.objects.create(player_1=player_1, player_2=player_2, player_3=player_3, player_4=player_4, is_active=True)