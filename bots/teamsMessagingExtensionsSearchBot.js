// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const axios = require('axios');
const querystring = require('querystring');
const { TeamsActivityHandler, CardFactory,MessageFactory, ConsoleTranscriptLogger } = require('botbuilder');
const fs = require('fs');
const AdaptiveCard = require('../Resources/RestaurantCard.json');
const ConnectorCard = require('../Resources/ConnectorCard.json');
// const configuration = require('dotenv').config();
// const env = configuration.parsed;
const baseurl = process.env.BaseUrl;
const publicDir = require('path').join(__dirname,'../public/Images'); 

class TeamsMessagingExtensionsSearchBot extends TeamsActivityHandler {
    
    async handleTeamsMessagingExtensionQuery(context, query) {
        const searchQuery = query.parameters[0].value;     
        const attachments = [];
        
        switch(searchQuery){
            case 'adaptive card':           
               return this.GetAdaptiveCard();
               
            case 'connector card':              
                return this.GetConnectorCard();

            case 'result grid': 
                return this.GetResultGrid();

            default: 
                const response = await axios.post('https://songwhip.com/', {
                    url: searchQuery
                });

                const thumbnailCard = CardFactory.thumbnailCard(
                    'BotFramework Thumbnail Card',
                    [{ url: 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg' }],
                    [],
                    {
                        subtitle: 'Your bots — wherever your users are talking.',
                        text: 'Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.',
                        tap: {
                            type: 'openUrl',
                            title: 'Get started',
                            value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
                        }
                    }
                );
                
                if (response.data) {
                    const heroCard = CardFactory.thumbnailCard(
                        `<a href="${response.data.url}">${response.data.name}</a>`,
                        [response.data.image],
                        [],
                        {
                            text: `Stream this ${response.data.type} via Songwhip`,
                            subtitle: `${response.data.artists[0].name}`,
                            tap: {
                                type: 'openUrl',
                                title: 'Open Link',
                                value: response.data.url
                            }
                        });
                    const preview = CardFactory.thumbnailCard(`${response.data.artists[0].name} - ${response.data.name}`, [ response.data.image ]);
                    // preview.content.tap = { type: 'invoke', value: { description: `${response.data.artists[0].name} b-b ${response.data.name}` } };
                    const attachment = { ...heroCard, preview };
                    attachments.push(attachment);
                }
    
                return {
                    composeExtension:  {
                           type: 'result',
                           attachmentLayout: 'list',
                           attachments: attachments
                    }
                };
            }       
        }

     GetAdaptiveCard() {
        const preview = CardFactory.thumbnailCard(
                'Adaptive Card',
                'Please select to get the card'
        );

        const adaptive = CardFactory.adaptiveCard(AdaptiveCard);
        
        const attachment = { ...adaptive, preview };

        return {
            composeExtension: {
                   type: 'result',
                   attachmentLayout: 'list',
                   attachments: [attachment]
            }
        };
    }
    
    GetConnectorCard() {    
        const preview = CardFactory.thumbnailCard(
                'Connector Card',
                'Please select to get the card'
        );

        const connector = CardFactory.o365ConnectorCard(ConnectorCard);
        const attachment = {...connector, preview };

        return {
            composeExtension: {
                   type: 'result',
                   attachmentLayout: 'list',
                   attachments: [attachment]
            }
        };
    }
   
    GetResultGrid() {
        const attachments = [];    
        const files = fs.readdirSync(publicDir, (err, result) => {
            if(err) {    
               console.error('error', err);
            }
        });

        files.forEach((file) => {
            const grid = CardFactory.thumbnailCard(
                '',
                [{ url: `${baseurl}/Images/${file}` }]
            );

            attachments.push(grid);
       });
       
        return {
            composeExtension: {
                   type: 'result',
                   attachmentLayout: 'grid',
                   attachments: attachments
                }
            };     
        }

    async handleTeamsMessagingExtensionSelectItem(context, obj) {
        
        return {
            composeExtension: {
                  type: 'result',
                  attachmentLayout: 'list',
                  attachments: [CardFactory.thumbnailCard(obj.description)]
            }
        };

    } 
}

module.exports.TeamsMessagingExtensionsSearchBot = TeamsMessagingExtensionsSearchBot;
