/**                                                                                                                                   
 * Calls the Natural Language Understanding service and returns a location type and disambiguation.                                   
 * @param {Object} params The parameters                                                                                              
 * @param {String} params.NLU_USERNAME The username for the NLU service.                                                              
 * @param {String} params.NLU_PASSWORD The password for the NLU service.                                                              
 */
console.log('nlu');
function main(params) {
  return new Promise(function(resolve, reject) {
    const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
    const USERNAME = params.NLU_USERNAME;
    const PASSWORD = params.NLU_PASSWORD;
        
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const natural_language_understanding = new NaturalLanguageUnderstandingV1({
      username: USERNAME,
      password: PASSWORD,
      version_date: '2017-02-27'
    });
    console.log('validated credentials');
        
    var parameters = {
      text: params.conversation.input.text,
      language: 'en',
      features: {
        entities: {
          limit: 1,
          Location: params.conversation.input.text
        }
      }
    };
        
    var isLowerCaseState = false;
    if (params.conversation.context.city && params.conversation.context.city.states) {
      for (const key of Object.keys(params.conversation.context.city.states)) {
        let lowercase = key.toLowerCase();
        console.log(lowercase);
        if (params.conversation.input.text === lowercase) {
          isLowerCaseState = true;
          params.conversation.input.text = key;
        }
      }
    }
        
    console.log('analyzing nlu');
    natural_language_understanding.analyze(parameters, function(err, response) {
      var output = params._id ? Object.assign({}, {conversation: params.conversation}, {_id: params._id}, {_rev: params._rev}) : Object.assign({}, {conversation: params.conversation});
      var context = params.conversation.context;
            
      if (err && parameters.text !== '') {
        console.log('error');
        console.log(err);
        return reject(err);
      }
            
      else if (daysOfWeek.indexOf(parameters.text) >= 0) {
        console.log('detected day');
        output.conversation.context.date = parameters.text;
        output.conversation.context.today = parameters.text;
        // to determine if the day of the week for tomorrow falls at the end of the week
        let tomorrow = (daysOfWeek.indexOf(parameters.text) < daysOfWeek.length-2 ? daysOfWeek.indexOf(parameters.text) + 1 : 0);
        output.conversation.context.tomorrow = daysOfWeek[tomorrow];
      }
            
      else if (((context.abbreviations && context.abbreviations[parameters.text]) || (context.city && context.city.states[parameters.text]) || isLowerCaseState) && context.city.name) {              
        console.log('detected state');
        let state = context.abbreviations[parameters.text] ? context.abbreviations[parameters.text].full : params.conversation.input.text;
        output.conversation.context.state = state;
        console.log(state);

        output.conversation.context.city.states = {
          [state]: {
            longitude: context.city.states[state].longitude,
            latitude: context.city.states[state].latitude
          }
        };
        output.conversation.context.city.number_of_states = 1;
        output.conversation.context.abbreviations = {};
      }
            
      else if (response.entities.length > 0 && response.entities[0].disambiguation && response.entities[0].disambiguation.subtype[0] === 'City') {
        console.log('detected city');
        let location = response.entities
          .filter(e => e.type === 'Location');
                    
        let city_name = location[0].text;

        if (context.city.name !== parameters.text && context.weather_conditions) {
          console.log('new city');
          delete output.conversation.context.weather_conditions;
          output.conversation.context.city.states = {};
          output.conversation.context.city.number_of_states = null;
        }
        // replace empty location field with new details of the detected city                                                  
        output.conversation.context.city.name = city_name;
        output.conversation.context.city.alternate_name = city_name;
        output.conversation.context.state = '';
      }
            
      else {
        console.log('no city');
        output.conversation.context.city = {
          name: '',
          number_of_states: null,
          alternate_name: '',
          states: {}
        };
        output.conversation.context.state = '';
      }
      return resolve(output);
    });
  });
}
