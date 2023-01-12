import * as React from 'react';

/**
 * reconciler 与 react 解耦， 所以要在shared 里面做中转，数据共享
 * internals n.	内脏；本性 网络:	内部；内控者；内件
 */
const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

export default internals;
