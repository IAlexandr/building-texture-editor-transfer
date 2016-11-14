import React from 'react';
import {Route, Redirect} from 'react-router';
import Main from './components/Main';
import AddressList from './components/AddressList';
import Editor from './components/Editor/index';
import User from './components/User';
import AccessDenied from './components/AccessDenied';
import {checkAccess} from 'basic-auth';

export default function (store) {
  return (
    <Route component={Main}>
      <Route path="/" component={AddressList}>
        <Route path="/user" component={User}/>
        <Redirect from="/editor" to="/"/>
        <Route path="/editor/:registerNo" component={Editor}/>
        <Route path="/403" component={AccessDenied}/>
      </Route>
      <Redirect from="*" to="/"/>
    </Route>
  );
}
