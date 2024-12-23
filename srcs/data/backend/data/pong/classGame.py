import asyncio
from datetime import datetime
from time import sleep
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from asgiref.sync import sync_to_async
from django.db import models
from . import initValues as iv
import random

list_of_games = []

#class for a game with a ball and two players
class PongGame:
    def __init__(self, player1, *args, **kwargs):
        self.player_1 = 0
        self.player_2 = 0
        self.name = "game"
        self.nbPlayers = 0
        self.player_1_score = 0
        self.player_2_score = 0
        self.ball_position_x = iv.GAME_WIDTH // 2
        self.ball_position_y = iv.GAME_HEIGHT // 2
        self.ball_speed_x = iv.BALL_SPEED_X
        self.ball_speed_y = iv.BALL_SPEED_Y
        self.player_1_position = iv.GAME_HEIGHT // 2
        self.player_2_position = iv.GAME_HEIGHT // 2
        self.move_player_1_up = False
        self.move_player_2_up = False
        self.move_player_1_down = False
        self.move_player_2_down = False
        self.is_active = False
        self.channel_player_1 = None
        self.channel_player_2 = None
        self.winner = None
        self.loser = None
        self.channel_winner = None
        self.channel_loser = None
        self.id = 0
        self.status = 0
        self.intournament = False
        self.created_at = datetime.now()

    #loop for the game
    async def game_loop(self):
        # print("game loop")
        if (self.is_active == False):
            if(self.status == "ready"):
                await self.broadcastState()
                await self.start_game()
        await asyncio.sleep(4.8)
        if self.intournament == True:
            await asyncio.sleep(0.8)
        while self.is_active:
            await self.move_ball()
            await self.move_player_loop()
            await asyncio.sleep(0.01)

    #start the game
    async def start_game(self):
        # print("start game")
        self.is_active = True
        await self.send_define_player('player_1', 'player_2')
        self.reset_ball()
        # print("game name : ", self.name)
        self.channel_layer = get_channel_layer()
        # print("channel player 1 : ", self.channel_player_1, "username : ", self.player_1.nickname)
        # print("channel player 2 : ", self.channel_player_2, "username : ", self.player_2.nickname)
        await self.channel_layer.group_send(
            f"game_{self.id}",
            {
                'type': 'start_game',
                'game': {
                    'player_1_score': self.player_1_score,
                    'player_2_score': self.player_2_score,
                    'ball_position': {
                        'x': self.ball_position_x,
                        'y': self.ball_position_y
                    },
                    'player_1_position': self.player_1_position,
                    'player_2_position': self.player_2_position,
                    'game_name': self.name,
                    'player1_name': self.player_1.nickname,
                    'player2_name': self.player_2.nickname
                }
            }
        )

    #send all the informations about the game to the players
    async def broadcastState(self):
        # print("broadcast state")
        self.channel_layer = get_channel_layer()
        await self.channel_layer.group_send(
            f"game_{self.id}",
            {
                'type': 'game_state',
                'game': {
                    'player_1_score': self.player_1_score,
                    'player_2_score': self.player_2_score,
                    'ball_position': {
                        'x': self.ball_position_x,
                        'y': self.ball_position_y
                    },
                    'player_1_position': self.player_1_position,
                    'player_2_position': self.player_2_position
                }
            }
        )

    async def send_define_player(self, current_player_1, current_player_2):
        # print("send define player")
        self.channel_layer = get_channel_layer()
        await self.channel_layer.send(
            self.channel_player_1,
            {
                'type': 'define_player',
                'name_player': self.player_1.nickname,
                'current_player': current_player_1,
                'game': self.name
            }
        )
        await self.channel_layer.send(
            self.channel_player_2,
            {
                'type': 'define_player',
                'name_player': self.player_2.nickname,
                'current_player': current_player_2,
                'game': self.name
            }
        )

    #reset the ball position
    def reset_ball(self):
        # print("reset ball")
        self.ball_position_x = iv.GAME_WIDTH // 2
        self.ball_position_y = iv.GAME_HEIGHT // 2
        self.player_1_position = iv.GAME_HEIGHT // 2
        self.player_2_position = iv.GAME_HEIGHT // 2
        self.ball_speed_x = iv.BALL_SPEED_X * random.choice([-1, 1])
        self.ball_speed_y = iv.BALL_SPEED_Y * random.uniform(0.5, 1.5) * random.choice([-1, 1])
    
    #move the ball
    async def move_ball(self):
        self.ball_position_x += self.ball_speed_x
        self.ball_position_y += self.ball_speed_y

        await self.colliding()
        await self.broadcastState()

    async def colliding(self):
        #check if the ball is colliding with the top or the bottom of the screen
        if self.ball_position_y <= 0 or self.ball_position_y >= iv.GAME_HEIGHT:
            self.ball_speed_y *= -1
        #check if the ball is colliding with the paddles
        if self.ball_position_x <= 0 + iv.PADDLE_WIDTH:
            if self.ball_position_y > self.player_1_position and self.ball_position_y < self.player_1_position + iv.PADDLE_HEIGHT:
                self.inverse_direction(self.player_1_position)
            else:
                self.player_2_score += 1
                self.reset_ball()
                if self.player_2_score >= iv.WINNING_SCORE:
                    await self.broadcastState()
                    await self.stop_game()
        elif self.ball_position_x >= iv.GAME_WIDTH - iv.PADDLE_WIDTH:
            if self.ball_position_y > self.player_2_position and self.ball_position_y < self.player_2_position + iv.PADDLE_HEIGHT:
                self.inverse_direction(self.player_2_position)
            else:
                self.player_1_score += 1
                self.reset_ball()
                if self.player_1_score >= iv.WINNING_SCORE:
                    await self.broadcastState()
                    await self.stop_game()
    
    def inverse_direction(self, paddle_position):
        self.ball_speed_x *= -1
        impact = self.ball_position_y - paddle_position - iv.PADDLE_HEIGHT / 2
        ratio = 35 / (iv.PADDLE_HEIGHT / 2)
        self.ball_speed_y = round(impact * ratio / 10)
        if self.ball_speed_x < iv.BALL_SPEED_MAX and self.ball_speed_x > -iv.BALL_SPEED_MAX:
            self.ball_speed_x *= 1.2

    #move the player
    def move_player(self, player, move):
        print("move player : ", player, " ", move)
        if player == 'player_1':
            if move == "up":
                self.move_player_1_up = True
            elif move == "down":
                self.move_player_1_down = True
            elif move == "stop up":
                self.move_player_1_up = False
            elif move == "stop down":
                self.move_player_1_down = False
        elif player == 'player_2':
            if move == "up":
                self.move_player_2_up = True
            elif move == "down":
                self.move_player_2_down = True
            elif move == "stop up":
                self.move_player_2_up = False
            elif move == "stop down":
                self.move_player_2_down = False
    
    #loop for the player movement
    async def move_player_loop(self):
        # print("move player loop")
        if self.move_player_1_up:
            position = self.player_1_position - iv.PADDLE_SPEED
            self.player_1_position = max(0, position)
        elif self.move_player_1_down:
            position = self.player_1_position + iv.PADDLE_SPEED
            self.player_1_position = min(iv.GAME_HEIGHT - iv.PADDLE_HEIGHT, position)
        if self.move_player_2_up:
            position = self.player_2_position - iv.PADDLE_SPEED
            self.player_2_position = max(0, position)
        elif self.move_player_2_down:
            position = self.player_2_position + iv.PADDLE_SPEED
            self.player_2_position = min(iv.GAME_HEIGHT - iv.PADDLE_HEIGHT, position)

    #stop the game
    async def stop_game(self):
        # print("stop game : ", self.name)
        self.is_active = False
        self.status = "finished"
        if self.winner is None :
            self.winner = self.player_1 if self.player_1_score > self.player_2_score else self.player_2
        if self.loser is None :
            self.loser = self.player_1 if self.player_1_score < self.player_2_score else self.player_2
        self.channel_winner = self.channel_player_1 if self.winner == self.player_1 else self.channel_player_2
        self.channel_loser = self.channel_player_1 if self.loser == self.player_1 else self.channel_player_2
        if self.player_1.nickname != 'anonymous_player' and self.player_2.nickname != 'anonymous_player':
            await self.save_game()
        # print("winner : ", self.winner.nickname)
        # print("loser : ", self.loser.nickname)

        await self.channel_layer.group_send(
            f"game_{self.id}",
            {
                'type': 'end_of_game',
                'winner': self.winner.nickname,
                'score_winner': self.player_1_score if self.player_1_score >= self.player_2_score else self.player_2_score,
                'score_loser': self.player_1_score if self.player_1_score < self.player_2_score else self.player_2_score
            }
        )

    #save the game in the database
    async def save_game(self):
        # print("save game")
        from pong.models import Game
        game_database = await sync_to_async(Game.objects.get, thread_sensitive=True)(id=self.id)
        game_database.player_1_score = self.player_1_score
        game_database.player_2_score = self.player_2_score
        game_database.is_active = False
        game_database.intournament = self.intournament
        await sync_to_async(game_database.save, thread_sensitive=True)()

        from api.models import MatchHistory
        match_history_player_1 = MatchHistory(player=self.player_1, game=game_database)
        match_history_player_2 = MatchHistory(player=self.player_2, game=game_database)
        await sync_to_async(match_history_player_1.save, thread_sensitive=True)()
        await sync_to_async(match_history_player_2.save, thread_sensitive=True)()

