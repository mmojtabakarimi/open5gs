import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { MODEL, fetchSubscribers, deleteSubscriber } from 'modules/crud/subscriber';
import { clearActionStatus } from 'modules/crud/actions';
import { select, selectActionStatus } from 'modules/crud/selectors';
import * as Notification from 'modules/notification/actions';

import { 
  Layout, 
  Subscriber, 
  Spinner, 
  FloatingButton, 
  Blank,
  Dimmed,
  Confirm
} from 'components';

import Document from './Document';

class Collection extends Component {
  state = {
    search: '',
    document: {
      action: '',
      visible: false,
      dimmed: false
    },
    view: {
      visible: false,
      imsi: ''
    },
    confirm: {
      visible: false,
      imsi: ''
    }
  };

  componentWillMount() {
    const { subscribers, dispatch } = this.props

    if (subscribers.needsFetch) {
      dispatch(subscribers.fetch)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { subscribers, status } = nextProps
    const { dispatch } = this.props

    if (subscribers.needsFetch) {
      dispatch(subscribers.fetch)
    }

    if (status.response) {
      dispatch(Notification.success({
        title: 'Subscriber',
        message: `${status.id} has been deleted`
      }));
      dispatch(clearActionStatus(MODEL, 'delete'));
    } 

    if (status.error) {
      const title = ((((status || {}).error || {}).response || {}).data || {}).name || 'Server Error';
      const message = ((((status || {}).error || {}).response || {}).data || {}).message || 'Unknown Error';

      dispatch(Notification.error({
        title,
        message,
        autoDismiss: 0,
        action: {
          label: 'Dismiss'
        }
      }));
      dispatch(clearActionStatus(MODEL, 'delete'));
    }
  }

  handleSearchChange = (e) => {
    this.setState({
      search: e.target.value
    });
  }

  handleSearchClear = (e) => {
    this.setState({
      search: ''
    });
  }

  documentHandler = {
    show: (action, payload) => {
      this.setState({
        document: {
          action,
          visible: true,
          dimmed: true,
          ...payload
        }
      })
    },
    hide: () => {
      this.setState({
        document: {
          ...this.state.document,
          visible: false,
          dimmed: false
        }
      })
    },
    actions: {
      create: () => {
        this.documentHandler.show('create');
      },
      update: (imsi) => {
        this.documentHandler.show('update', { imsi });
      }
    }
  }

  viewHandler = {
    show: (subscriber) => {
      this.setState({
        view: {
          subscriber,
          visible: true
        }
      });
    },
    hide: () => {
      this.setState({
        view: {
          ...this.state.view,
          visible: false
        }
      })
    }
  }

  confirmHandler = {
    show: (imsi) => {
      this.setState({
        confirm: {
          imsi,
          visible: true
        }
      })
    },
    hide: () => {
      this.setState({
        confirm: {
          ...this.state.confirm,
          visible: false
        }
      })
    },
    delete: () => {
      const { dispatch } = this.props

      if (this.state.confirm.visible === true) {
        this.confirmHandler.hide();
        dispatch(deleteSubscriber(this.state.confirm.imsi));
      }
    }
  }

  render() {
    const {
      handleSearchChange,
      handleSearchClear,
      documentHandler,
      viewHandler,
      confirmHandler
    } = this;

    const { 
      search,
      document
    } = this.state;

    const { 
      subscribers,
      status
    } = this.props

    const {
      isLoading,
      data
    } = subscribers;

    return (
      <Layout.Content>
        {Object.keys(data).length > 0 && <Subscriber.Search 
          onChange={handleSearchChange}
          value={search}
          onClear={handleSearchClear} />}
        <Subscriber.List
          subscribers={data}
          deletedImsi={status.id}
          onView={viewHandler.show}
          onEdit={documentHandler.actions.update}
          onDelete={confirmHandler.show}
          search={search}
        />
        {isLoading && <Spinner md />}
        <Blank
          visible={!isLoading && !(Object.keys(data).length > 0)}
          title="ADD A SUBSCRIBER"
          body="You have no subscribers... yet!"
          onTitle={documentHandler.actions.create}
          />
        <FloatingButton onClick={documentHandler.actions.create}/>
        <Subscriber.View
          visible={this.state.view.visible}
          subscriber={this.state.view.subscriber}
          onEdit={documentHandler.actions.update}
          onDelete={confirmHandler.show}
          onHide={viewHandler.hide}/>
        <Document 
          { ...document }
          onEdit={documentHandler.actions.update}
          onDelete={confirmHandler.show}
          onHide={documentHandler.hide} />
        <Dimmed visible={document.dimmed} />
        <Confirm
          visible={this.state.confirm.visible}
          message="Delete this subscriber?"
          onOutside={confirmHandler.hide}
          buttons={[
            { text: "CANCEL", action: confirmHandler.hide, info:true },
            { text: "DELETE", action: confirmHandler.delete, danger:true }
          ]}/>
      </Layout.Content>
    )
  }
}

Collection = connect(
  (state) => ({ 
    subscribers: select(fetchSubscribers(), state.crud),
    status: selectActionStatus(MODEL, state.crud, 'delete')
  })
)(Collection);

export default Collection;