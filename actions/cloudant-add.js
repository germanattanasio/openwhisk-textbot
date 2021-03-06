console.log('reading from cloudant');
function main(params) {
  if (params._rev !== null) {
    console.log('Document exists');
    var output = Object.assign({}, {conversation: params.conversation}, {_id: params._id}, {_rev: params._rev});
    return output;
  }
  else if (!params._id || !params.id) {
    Promise.reject(new Error('id cannot be null'));
  }
    
  //load the package
  const Cloudant = require('cloudant');
  const username = params.CLOUDANT_USERNAME;
  const password = params.CLOUDANT_PASSWORD;
  var dbname = 'owtextbotdb';
  var owdb = null;
  console.log('connecting to cloudant');
  //connect to Cloudant
  const cloudant = Cloudant({
    account: username,
    password: password
  });
  console.log('connected');
    
  console.log('checking if exists');
  try {
    console.log('creating');
    owdb = cloudant.db.create(dbname);
    if (db != null) {
      console.log('db exists');
      owdb = cloudant.db.use(dbname);
    }
  } catch(e) {
    console.log('catching');    
    owdb = cloudant.db.use(dbname);
  }
    
  return new Promise(function(resolve, reject) {
    console.log('inserting');
    owdb.insert({'context': {}}, params._id, function(err, body, header) {
      if (err) {
        console.log('[db.insert]', err.message);
        return reject(err);
      }
      console.log('You have inserted the doc.');
      var output = Object.assign({}, {conversation: params.conversation}, {_id: params._id}, {_rev: body.rev});            
      return resolve(output);
    });
  });
}
