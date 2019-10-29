export const editFileName = (req, file, callback) => {
    const name = req.query.userHash;
    callback(null, `${name}`);
};
